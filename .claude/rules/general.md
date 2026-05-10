# General Conventions

- Never add co-author lines to git commits.
- Keep responses concise — no trailing summaries of what was just done.
- When adding new Tauri commands, update both the Rust handler and the `useS3.ts` hook, and register the command in `lib.rs`.
- When adding new TypeScript interfaces that mirror Rust structs, keep field names consistent (use snake_case to match serde serialization).
- Prefer editing existing files over creating new ones.
- No test framework is configured — verify changes compile (`pnpm tsc -b --noEmit` for frontend, `cargo check` for backend).
