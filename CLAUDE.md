# S3 Browser — Claude Code Instructions

Desktop S3 browser for AWS and S3-compatible endpoints (LocalStack, MinIO).
Built with Tauri v2, React 19, TypeScript, Rust, Tailwind CSS 4.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS 4, shadcn/Base UI, Geist font
- **Backend**: Rust, Tauri v2, aws-sdk-s3, tokio
- **Styling**: OkLCH color tokens, dark mode via next-themes, tw-animate-css
- **CI**: GitHub Actions — lint (tsc + clippy/fmt) → build matrix (macOS aarch64/x86_64, Windows)

## Architecture

```
src/                          # React frontend
├── App.tsx                   # Main component — all state and layout
├── hooks/useS3.ts            # Tauri invoke() wrappers for all commands
├── types.ts                  # Shared TS interfaces (BucketInfo, ObjectInfo, SavedConnection)
├── components/               # Feature + UI components
│   ├── ConnectionDialog.tsx   ConnectionSidebar.tsx   BucketList.tsx
│   ├── ObjectTable.tsx        FilePreview.tsx         Toolbar.tsx
│   ├── Breadcrumbs.tsx
│   └── ui/                   # shadcn/Base UI primitives
└── index.css                 # Tailwind config + OkLCH color tokens

src-tauri/src/                # Rust backend
├── lib.rs                    # Tauri setup, plugin init, command registration
├── s3.rs                     # S3 operations (connect, list, upload, download, rename, delete)
└── storage.rs                # Persistent connection storage (~/.config/s3client/connections.json)
```

## IPC Contract

Frontend calls `invoke("command_name", { args })` → Rust `#[tauri::command]` handlers.
All S3 commands take `connectionId` (UUID string) as first arg to look up `S3Client` from `Mutex<HashMap<String, S3Client>>`.

**S3 commands**: `connect`, `disconnect`, `list_buckets`, `list_objects`, `download_object`, `download_folder`, `upload_object`, `create_folder`, `rename_object`, `delete_object`, `get_object_bytes`
**Storage commands**: `save_connection`, `list_saved_connections`, `delete_saved_connection`

## Dev Commands

```bash
pnpm install          # Install frontend deps
cargo tauri dev       # Run dev mode (Vite + Tauri)
cargo tauri build     # Production build
pnpm tsc -b --noEmit  # Type check frontend
cd src-tauri && cargo clippy -- -D warnings  # Lint Rust
cd src-tauri && cargo fmt --check             # Format check Rust
```

## Conventions

- Path alias: `@/` maps to `./src/`
- No test framework configured yet — test manually via `cargo tauri dev`
- Tauri plugins: dialog, clipboard-manager, fs, updater
- Force path-style enabled for S3-compatible endpoints
- Connection credentials stored in app data dir as JSON

## Wiki

The `wiki/` directory contains an LLM-maintained knowledge base. See `wiki/schema.md` for conventions. When making significant changes, update relevant wiki pages.
