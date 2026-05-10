---
title: CI/CD
type: architecture
last-updated: 2026-05-10
related: [frontend.md, backend.md]
---

# CI/CD

## Workflows

### ci.yml — Continuous Integration

Triggers: PRs to `main`, pushes to `main`. Concurrency group cancels in-progress runs.

**Jobs:**

1. **lint-frontend** (ubuntu-latest)
   - pnpm install → `pnpm tsc -b --noEmit`

2. **lint-backend** (ubuntu-latest)
   - Install system deps (webkit2gtk, appindicator, rsvg, patchelf, gtk3)
   - `cargo fmt --check` → `cargo clippy -- -D warnings` → `cargo check`

3. **build** (matrix, depends on both lint jobs)
   - macOS-latest: aarch64-apple-darwin, x86_64-apple-darwin
   - windows-latest: x86_64-pc-windows-msvc
   - Uses `tauri-apps/tauri-action@v0`

### publish.yml — Release

Handles release builds and publishing to GitHub Releases. Uses the same tauri-action for building platform-specific binaries.

## Toolchain Versions

- Node.js 22
- pnpm 9
- Rust stable toolchain
- Rust cache via `Swatinem/rust-cache@v2` (workspace: `src-tauri`)

## Auto-Updater

Configured in `tauri.conf.json` to check `https://github.com/zenhix/s3client/releases/latest/download/latest.json` for updates. Public key field is currently empty (needs to be set for signed updates).
