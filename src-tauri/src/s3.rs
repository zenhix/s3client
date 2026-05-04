use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_s3::config::Builder as S3ConfigBuilder;
use aws_sdk_s3::Client as S3Client;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
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
    let creds = Credentials::new(&access_key, &secret_key, None, None, "s3browser");

    let mut config_builder = S3ConfigBuilder::new()
        .region(Region::new(region))
        .credentials_provider(creds)
        .force_path_style(true);

    if !endpoint.is_empty() {
        config_builder = config_builder.endpoint_url(&endpoint);
    }

    let client = S3Client::from_conf(config_builder.build());

    // Test the connection by listing buckets
    client
        .list_buckets()
        .send()
        .await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let connection_id = Uuid::new_v4().to_string();
    state
        .clients
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?
        .insert(connection_id.clone(), client);

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
