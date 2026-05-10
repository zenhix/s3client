---
paths:
  - ".github/**"
---

# CI/CD Rules

- CI runs on PRs to `main` and pushes to `main`.
- Two lint jobs: `lint-frontend` (pnpm tsc) and `lint-backend` (cargo fmt --check, cargo clippy, cargo check).
- Build matrix: macOS aarch64, macOS x86_64, Windows x86_64.
- Build uses `tauri-apps/tauri-action@v0`.
- Node 22 + pnpm 9 for frontend. Stable Rust toolchain for backend.
- Ubuntu lint jobs need system deps: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libgtk-3-dev`.
- `publish.yml` handles release builds — uses the same tauri-action.
