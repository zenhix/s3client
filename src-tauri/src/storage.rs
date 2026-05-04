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

    // Update existing or add new
    if let Some(existing) = connections.iter_mut().find(|c| c.id == connection.id) {
        *existing = connection;
    } else {
        connections.push(connection);
    }

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
