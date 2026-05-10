use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    #[serde(default = "default_connection_type")]
    pub connection_type: String,
    pub endpoint: String,
    pub region: String,
    pub access_key: String,
    pub secret_key: String,
}

fn default_connection_type() -> String {
    "local".to_string()
}

/// Find existing connection by endpoint+region+access_key, or return None
pub fn find_matching_connection(
    connections: &[SavedConnection],
    endpoint: &str,
    region: &str,
    access_key: &str,
) -> Option<usize> {
    connections
        .iter()
        .position(|c| c.endpoint == endpoint && c.region == region && c.access_key == access_key)
}

/// Upsert a connection into the list (match by endpoint+region+access_key)
pub fn upsert_connection(connections: &mut Vec<SavedConnection>, connection: SavedConnection) {
    if let Some(idx) = find_matching_connection(
        connections,
        &connection.endpoint,
        &connection.region,
        &connection.access_key,
    ) {
        let existing = &mut connections[idx];
        existing.id = connection.id;
        existing.name = connection.name;
        existing.connection_type = connection.connection_type;
        existing.secret_key = connection.secret_key;
    } else {
        connections.push(connection);
    }
}

fn get_connections_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_data).map_err(|e| format!("Failed to create dir: {}", e))?;
    Ok(app_data.join("connections.json"))
}

fn load_connections(app: &AppHandle) -> Result<Vec<SavedConnection>, String> {
    let path = get_connections_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Failed to read: {}", e))?;
    serde_json::from_str(&data).map_err(|e| format!("Failed to parse: {}", e))
}

fn save_connections(app: &AppHandle, connections: &[SavedConnection]) -> Result<(), String> {
    let path = get_connections_path(app)?;
    let data = serde_json::to_string_pretty(connections)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write: {}", e))
}

#[tauri::command]
pub fn save_connection(app: AppHandle, connection: SavedConnection) -> Result<(), String> {
    let mut connections = load_connections(&app)?;
    upsert_connection(&mut connections, connection);
    save_connections(&app, &connections)
}

#[tauri::command]
pub fn list_saved_connections(app: AppHandle) -> Result<Vec<SavedConnection>, String> {
    load_connections(&app)
}

#[tauri::command]
pub fn delete_saved_connection(app: AppHandle, id: String) -> Result<(), String> {
    let mut connections = load_connections(&app)?;
    connections.retain(|c| c.id != id);
    save_connections(&app, &connections)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_conn(id: &str, endpoint: &str, region: &str, access_key: &str) -> SavedConnection {
        SavedConnection {
            id: id.to_string(),
            name: "Test".to_string(),
            connection_type: "local".to_string(),
            endpoint: endpoint.to_string(),
            region: region.to_string(),
            access_key: access_key.to_string(),
            secret_key: "secret".to_string(),
        }
    }

    #[test]
    fn test_upsert_adds_new_connection() {
        let mut conns = vec![];
        let conn = make_conn("1", "http://localhost:4566", "us-east-1", "test");
        upsert_connection(&mut conns, conn);
        assert_eq!(conns.len(), 1);
        assert_eq!(conns[0].id, "1");
    }

    #[test]
    fn test_upsert_updates_existing_connection() {
        let mut conns = vec![make_conn("1", "http://localhost:4566", "us-east-1", "test")];
        let mut updated = make_conn("2", "http://localhost:4566", "us-east-1", "test");
        updated.name = "Updated".to_string();
        updated.secret_key = "new-secret".to_string();
        upsert_connection(&mut conns, updated);
        assert_eq!(conns.len(), 1);
        assert_eq!(conns[0].id, "2");
        assert_eq!(conns[0].name, "Updated");
        assert_eq!(conns[0].secret_key, "new-secret");
    }

    #[test]
    fn test_upsert_different_endpoint_adds_new() {
        let mut conns = vec![make_conn("1", "http://localhost:4566", "us-east-1", "test")];
        let conn2 = make_conn("2", "http://localhost:9000", "us-east-1", "test");
        upsert_connection(&mut conns, conn2);
        assert_eq!(conns.len(), 2);
    }

    #[test]
    fn test_find_matching_connection() {
        let conns = vec![
            make_conn("1", "http://localhost:4566", "us-east-1", "test"),
            make_conn("2", "", "us-west-2", "AKIA123"),
        ];
        assert_eq!(
            find_matching_connection(&conns, "http://localhost:4566", "us-east-1", "test"),
            Some(0)
        );
        assert_eq!(
            find_matching_connection(&conns, "", "us-west-2", "AKIA123"),
            Some(1)
        );
        assert_eq!(
            find_matching_connection(&conns, "http://other:4566", "us-east-1", "test"),
            None
        );
    }

    #[test]
    fn test_default_connection_type() {
        let json = r#"{"id":"1","name":"Test","endpoint":"","region":"us-east-1","access_key":"k","secret_key":"s"}"#;
        let conn: SavedConnection = serde_json::from_str(json).unwrap();
        assert_eq!(conn.connection_type, "local");
    }

    #[test]
    fn test_serialization_roundtrip() {
        let conn = make_conn("1", "http://localhost:4566", "us-east-1", "test");
        let json = serde_json::to_string(&conn).unwrap();
        let parsed: SavedConnection = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, conn.id);
        assert_eq!(parsed.endpoint, conn.endpoint);
        assert_eq!(parsed.connection_type, conn.connection_type);
    }
}
