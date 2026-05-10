---
title: Connection Lifecycle
type: concept
last-updated: 2026-05-10
related: [../architecture/backend.md, ../architecture/ipc.md, s3-operations.md]
---

# Connection Lifecycle

## Overview

Connections represent authenticated S3 sessions. The app supports both AWS S3 and S3-compatible endpoints (LocalStack, MinIO).

## Connection Flow

1. **User fills form** — endpoint (optional for AWS), region, access key, secret key, display name, type (local/aws)
2. **`connect()` called** — Rust creates `S3Client` with hardcoded credentials, force path-style enabled
3. **Validation** — `list_buckets()` called with 10s timeout to verify credentials work
4. **UUID assigned** — On success, client stored in `Mutex<HashMap<String, S3Client>>`, UUID returned
5. **Optionally saved** — `save_connection()` persists to `~/.config/s3client/connections.json`
6. **Disconnect** — `disconnect()` removes client from the HashMap

## Credential Storage

Connections are persisted as JSON in the app data directory:
- Path: `<app_data_dir>/connections.json`
- Resolved via Tauri's `app.path().app_data_dir()`
- Directory created automatically if missing
- Credentials stored in plaintext (access key + secret key)

## Upsert Logic

`save_connection()` matches existing connections by `(endpoint, region, access_key)`. If a match is found, it updates the existing entry. Otherwise, it appends a new one.

## Connection Types

- `"local"` — S3-compatible endpoint (LocalStack, MinIO). Requires endpoint URL.
- `"aws"` — AWS S3. Endpoint can be empty (uses default AWS endpoint).

## State

Active connections live in-memory only (`S3State`). Saved connections are persisted to disk. A saved connection must be re-connected each app session — the app does not auto-connect on launch.
