mod s3;
mod storage;

use s3::S3State;
use std::collections::HashMap;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .manage(S3State {
            clients: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            s3::connect,
            s3::disconnect,
            s3::list_buckets,
            s3::list_objects,
            s3::download_object,
            s3::upload_object,
            s3::delete_object,
            s3::get_object_bytes,
            storage::save_connection,
            storage::list_saved_connections,
            storage::delete_saved_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
