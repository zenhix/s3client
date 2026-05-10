---
title: Tauri IPC Contract
type: architecture
last-updated: 2026-05-10
related: [frontend.md, backend.md, ../concepts/connections.md, ../concepts/s3-operations.md]
---

# Tauri IPC Contract

## How IPC Works

Frontend calls `invoke("command_name", { args })` from `@tauri-apps/api/core`. Tauri serializes args as JSON, routes to the matching `#[tauri::command]` Rust function, deserializes args via serde, executes, and returns the result serialized back to JSON.

All IPC is wrapped in `src/hooks/useS3.ts` — components never call `invoke()` directly.

## Command Reference

### S3 Commands (src-tauri/src/s3.rs)

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `connect` | endpoint, region, accessKey, secretKey | `String` (UUID) | Create S3 client, test with list_buckets (10s timeout) |
| `disconnect` | connectionId | `()` | Remove client from state |
| `list_buckets` | connectionId | `BucketInfo[]` | List all buckets |
| `list_objects` | connectionId, bucket, prefix | `ObjectInfo[]` | List objects with "/" delimiter |
| `download_object` | connectionId, bucket, key, savePath | `()` | Download single file |
| `download_folder` | connectionId, bucket, prefix, savePath | `()` | Download folder as ZIP |
| `upload_object` | connectionId, bucket, key, filePath | `()` | Upload single file |
| `create_folder` | connectionId, bucket, key | `()` | Create empty object with "/" suffix |
| `rename_object` | connectionId, bucket, oldKey, newKey | `()` | Copy to new key + delete old |
| `delete_object` | connectionId, bucket, key | `()` | Delete single object |
| `get_object_bytes` | connectionId, bucket, key | `String` (base64) | Get object content as base64 |

### Storage Commands (src-tauri/src/storage.rs)

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `save_connection` | connection (SavedConnection) | `()` | Upsert by endpoint+region+access_key |
| `list_saved_connections` | — | `SavedConnection[]` | Load from connections.json |
| `delete_saved_connection` | id | `()` | Remove by ID |

## Data Types

```typescript
// Frontend (src/types.ts)
interface BucketInfo { name: string; created_at: string | null }
interface ObjectInfo { key: string; size: number; last_modified: string | null; is_folder: boolean }
interface SavedConnection { id: string; name: string; connection_type: "local" | "aws"; endpoint: string; region: string; access_key: string; secret_key: string }
```

Field names use snake_case in both TypeScript and Rust to match serde's default serialization.

## Adding a New Command

1. Write the `#[tauri::command]` function in `s3.rs` or `storage.rs`
2. Register it in `lib.rs` inside `invoke_handler![...]`
3. Add the wrapper function in `src/hooks/useS3.ts`
4. Add any new types to both `src/types.ts` and the Rust module
