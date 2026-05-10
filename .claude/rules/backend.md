---
paths:
  - "src-tauri/**"
---

# Backend Rules

- All S3 commands are in `src-tauri/src/s3.rs`. Storage commands are in `src-tauri/src/storage.rs`.
- New commands must be registered in the `invoke_handler!` macro in `lib.rs`.
- S3 client state: `Mutex<HashMap<String, S3Client>>` keyed by UUID. Always lock, clone client, drop lock before async operations.
- Use `Result<T, String>` as return type for all `#[tauri::command]` functions.
- Connection testing: the `connect` command validates credentials by calling `list_buckets()` with a 10s timeout.
- Run `cargo fmt` before committing Rust changes.
- Run `cargo clippy -- -D warnings` to ensure no warnings.
