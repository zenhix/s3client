use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_s3::config::Builder as S3ConfigBuilder;
use aws_sdk_s3::Client as S3Client;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;
use uuid::Uuid;

pub struct S3State {
    pub clients: Mutex<HashMap<String, S3Client>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BucketInfo {
    pub name: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObjectInfo {
    pub key: String,
    pub size: i64,
    pub last_modified: Option<String>,
    pub is_folder: bool,
}

#[tauri::command]
pub async fn connect(
    state: State<'_, S3State>,
    endpoint: String,
    region: String,
    access_key: String,
    secret_key: String,
) -> Result<String, String> {
    println!("[s3] connect called: endpoint={}, region={}, access_key={}", endpoint, region, access_key);

    let creds = Credentials::new(&access_key, &secret_key, None, None, "s3browser");

    let mut config_builder = S3ConfigBuilder::new()
        .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
        .region(Region::new(region))
        .credentials_provider(creds)
        .force_path_style(true);

    if !endpoint.is_empty() {
        config_builder = config_builder.endpoint_url(&endpoint);
    }

    let client = S3Client::from_conf(config_builder.build());

    println!("[s3] testing connection...");

    // Test the connection by listing buckets (with 10s timeout)
    match tokio::time::timeout(Duration::from_secs(10), client.list_buckets().send()).await {
        Ok(Ok(output)) => {
            let count = output.buckets().len();
            println!("[s3] connected successfully, found {} buckets", count);
        }
        Ok(Err(e)) => {
            println!("[s3] connection error: {}", e);
            return Err(format!("Failed to connect: {}", e));
        }
        Err(_) => {
            println!("[s3] connection timed out");
            return Err("Connection timed out after 10 seconds".to_string());
        }
    }

    let connection_id = Uuid::new_v4().to_string();
    state
        .clients
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?
        .insert(connection_id.clone(), client);

    println!("[s3] connection_id={}", connection_id);
    Ok(connection_id)
}

#[tauri::command]
pub async fn disconnect(state: State<'_, S3State>, connection_id: String) -> Result<(), String> {
    state
        .clients
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?
        .remove(&connection_id);
    Ok(())
}

fn get_client(
    state: &State<'_, S3State>,
    connection_id: &str,
) -> Result<S3Client, String> {
    state
        .clients
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?
        .get(connection_id)
        .cloned()
        .ok_or_else(|| "Connection not found".to_string())
}

#[tauri::command]
pub async fn list_buckets(
    state: State<'_, S3State>,
    connection_id: String,
) -> Result<Vec<BucketInfo>, String> {
    let client = get_client(&state, &connection_id)?;

    let output = client
        .list_buckets()
        .send()
        .await
        .map_err(|e| format!("Failed to list buckets: {}", e))?;

    let buckets = output
        .buckets()
        .iter()
        .map(|b| BucketInfo {
            name: b.name().unwrap_or("").to_string(),
            created_at: b.creation_date().map(|d| {
                d.fmt(aws_sdk_s3::primitives::DateTimeFormat::DateTime)
                    .unwrap_or_default()
            }),
        })
        .collect();

    Ok(buckets)
}

#[tauri::command]
pub async fn list_objects(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    prefix: String,
) -> Result<Vec<ObjectInfo>, String> {
    let client = get_client(&state, &connection_id)?;

    let mut request = client
        .list_objects_v2()
        .bucket(&bucket)
        .delimiter("/");

    if !prefix.is_empty() {
        request = request.prefix(&prefix);
    }

    let output = request
        .send()
        .await
        .map_err(|e| format!("Failed to list objects: {}", e))?;

    let mut objects: Vec<ObjectInfo> = Vec::new();

    // Add folders (common prefixes)
    for p in output.common_prefixes() {
        if let Some(prefix_str) = p.prefix() {
            objects.push(ObjectInfo {
                key: prefix_str.to_string(),
                size: 0,
                last_modified: None,
                is_folder: true,
            });
        }
    }

    // Add files
    for obj in output.contents() {
        let key = obj.key().unwrap_or("").to_string();
        // Skip the prefix itself if it shows up as an object
        if key == prefix || key.is_empty() {
            continue;
        }
        objects.push(ObjectInfo {
            key,
            size: obj.size().unwrap_or(0),
            last_modified: obj.last_modified().map(|d| {
                d.fmt(aws_sdk_s3::primitives::DateTimeFormat::DateTime)
                    .unwrap_or_default()
                }),
                is_folder: false,
            });
    }

    Ok(objects)
}

#[tauri::command]
pub async fn download_object(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    key: String,
    save_path: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;

    let output = client
        .get_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("Failed to download: {}", e))?;

    let bytes = output
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?
        .into_bytes();

    tokio::fs::write(&save_path, &bytes)
        .await
        .map_err(|e| format!("Failed to save file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn upload_object(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    key: String,
    file_path: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;

    let body = tokio::fs::read(&file_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    client
        .put_object()
        .bucket(&bucket)
        .key(&key)
        .body(body.into())
        .send()
        .await
        .map_err(|e| format!("Failed to upload: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_object(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    key: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;

    client
        .delete_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("Failed to delete: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn download_folder(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    prefix: String,
    save_path: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;

    // List all objects under the prefix recursively (no delimiter)
    let mut all_keys: Vec<String> = Vec::new();
    let mut continuation_token: Option<String> = None;

    loop {
        let mut request = client
            .list_objects_v2()
            .bucket(&bucket)
            .prefix(&prefix);

        if let Some(token) = &continuation_token {
            request = request.continuation_token(token);
        }

        let output = request
            .send()
            .await
            .map_err(|e| format!("Failed to list objects: {}", e))?;

        for obj in output.contents() {
            let key = obj.key().unwrap_or("").to_string();
            if !key.is_empty() && !key.ends_with('/') {
                all_keys.push(key);
            }
        }

        if output.is_truncated() == Some(true) {
            continuation_token = output.next_continuation_token().map(|s| s.to_string());
        } else {
            break;
        }
    }

    if all_keys.is_empty() {
        return Err("Folder is empty".to_string());
    }

    // Create zip file
    let file = std::fs::File::create(&save_path)
        .map_err(|e| format!("Failed to create zip file: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for key in &all_keys {
        // Strip the prefix to get relative path inside zip
        let relative = key.strip_prefix(&prefix).unwrap_or(key);

        let output = client
            .get_object()
            .bucket(&bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| format!("Failed to download {}: {}", key, e))?;

        let bytes = output
            .body
            .collect()
            .await
            .map_err(|e| format!("Failed to read {}: {}", key, e))?
            .into_bytes();

        zip.start_file(relative, options)
            .map_err(|e| format!("Zip error: {}", e))?;
        std::io::Write::write_all(&mut zip, &bytes)
            .map_err(|e| format!("Zip write error: {}", e))?;
    }

    zip.finish().map_err(|e| format!("Zip finish error: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn create_folder(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    key: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;

    let folder_key = if key.ends_with('/') { key.clone() } else { format!("{}/", key) };

    println!("[s3] create_folder: bucket={}, key={}", bucket, folder_key);

    client
        .put_object()
        .bucket(&bucket)
        .key(&folder_key)
        .body(Vec::new().into())
        .send()
        .await
        .map_err(|e| {
            println!("[s3] create_folder error: {}", e);
            format!("Failed to create folder: {}", e)
        })?;

    println!("[s3] create_folder success");
    Ok(())
}

#[tauri::command]
pub async fn rename_object(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    old_key: String,
    new_key: String,
) -> Result<(), String> {
    let client = get_client(&state, &connection_id)?;
    let is_folder = old_key.ends_with('/');

    if is_folder {
        // List all objects under the old prefix
        let mut all_keys: Vec<String> = Vec::new();
        let mut continuation_token: Option<String> = None;

        loop {
            let mut request = client
                .list_objects_v2()
                .bucket(&bucket)
                .prefix(&old_key);

            if let Some(token) = &continuation_token {
                request = request.continuation_token(token);
            }

            let output = request
                .send()
                .await
                .map_err(|e| format!("Failed to list objects: {}", e))?;

            for obj in output.contents() {
                let key = obj.key().unwrap_or("").to_string();
                if !key.is_empty() {
                    all_keys.push(key);
                }
            }

            if output.is_truncated() == Some(true) {
                continuation_token = output.next_continuation_token().map(|s| s.to_string());
            } else {
                break;
            }
        }

        // Copy each object to new prefix, then delete original
        for key in &all_keys {
            let relative = key.strip_prefix(&old_key).unwrap_or(key);
            let dest_key = format!("{}{}", new_key, relative);

            client
                .copy_object()
                .bucket(&bucket)
                .copy_source(format!("{}/{}", bucket, key))
                .key(&dest_key)
                .send()
                .await
                .map_err(|e| format!("Failed to copy {}: {}", key, e))?;

            client
                .delete_object()
                .bucket(&bucket)
                .key(key)
                .send()
                .await
                .map_err(|e| format!("Failed to delete {}: {}", key, e))?;
        }
    } else {
        // Single file: copy then delete
        client
            .copy_object()
            .bucket(&bucket)
            .copy_source(format!("{}/{}", bucket, old_key))
            .key(&new_key)
            .send()
            .await
            .map_err(|e| format!("Failed to copy: {}", e))?;

        client
            .delete_object()
            .bucket(&bucket)
            .key(&old_key)
            .send()
            .await
            .map_err(|e| format!("Failed to delete original: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_object_bytes(
    state: State<'_, S3State>,
    connection_id: String,
    bucket: String,
    key: String,
) -> Result<String, String> {
    let client = get_client(&state, &connection_id)?;

    let output = client
        .get_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("Failed to get object: {}", e))?;

    let bytes = output
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?
        .into_bytes();

    // Return as base64 encoded string
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}
