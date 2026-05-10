---
title: S3 Operations
type: concept
last-updated: 2026-05-10
related: [../architecture/ipc.md, ../architecture/backend.md, connections.md]
---

# S3 Operations

## Browsing

- **List buckets**: Returns all buckets with name and creation date.
- **List objects**: Uses `"/"` delimiter for folder-like navigation. Returns both objects (files) and common prefixes (folders). Folders are represented as `ObjectInfo` with `is_folder: true`.

## File Operations

### Upload
- Single file upload via `upload_object()`
- File read from local disk via `filePath`, uploaded to `bucket/key`
- Uses `ByteStream::from_path()`

### Download
- **Single file**: `download_object()` — streams to `savePath` on disk
- **Folder**: `download_folder()` — lists all objects under prefix, downloads each, packages into ZIP archive

### Preview
- `get_object_bytes()` returns file content as base64 string
- Frontend decodes and renders inline (images, text files)

## Mutations

### Create Folder
- Creates an empty object with key ending in `"/"`
- S3 has no native folder concept — this is a convention

### Rename
- **Copy + Delete pattern**: copies object to new key, then deletes the original
- Not atomic — if delete fails after copy, both copies exist

### Delete
- Deletes a single object by key
- No recursive delete — folders must be emptied first (handled by frontend)

## Error Handling

All operations return `Result<T, String>`. SDK errors are converted to human-readable strings. The frontend displays errors via toast notifications (sonner).
