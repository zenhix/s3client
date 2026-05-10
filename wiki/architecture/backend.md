---
title: Backend Architecture
type: architecture
last-updated: 2026-05-10
related: [frontend.md, ipc.md, ../concepts/connections.md, ../concepts/s3-operations.md]
---

# Backend Architecture

## Stack

Rust with Tauri v2. S3 operations via `aws-sdk-s3`. Async runtime: `tokio`.

## Module Structure

```
src-tauri/src/
├── main.rs      # Entry point — calls lib::run()
├── lib.rs       # Tauri builder: plugins, state, command registration
├── s3.rs        # S3 operations and S3State definition
└── storage.rs   # Persistent connection storage
```

## S3 State Management

```rust
pub struct S3State {
    pub clients: Mutex<HashMap<String, S3Client>>,
}
```

- Global state managed by Tauri's `manage()` system
- Keyed by UUID string generated on `connect()`
- Pattern: lock mutex → clone client → drop lock → perform async S3 operation
- No connection pooling — one `S3Client` per active connection

## Tauri Plugins

Registered in `lib.rs`:
- `tauri_plugin_dialog` — native file/folder dialogs
- `tauri_plugin_clipboard_manager` — copy to clipboard
- `tauri_plugin_fs` — filesystem access
- `tauri_plugin_updater` — auto-update from GitHub Releases

## Error Handling

All commands return `Result<T, String>` where errors are human-readable strings. Errors are mapped from SDK/IO errors via `.map_err(|e| format!(...))`.

## Dependencies

Key crates:
- `aws-sdk-s3` — S3 API client
- `aws-config` — region configuration
- `aws-credential-types` — hardcoded credentials provider
- `uuid` — connection ID generation
- `base64` — encoding for `get_object_bytes`
- `zip` — folder download as ZIP archive
- `serde` / `serde_json` — serialization
