# S3 Browser

Desktop S3 browser for AWS and S3-compatible endpoints (LocalStack, MinIO).

## Prerequisites

```bash
brew install rust
cargo install tauri-cli --version "^2"
pnpm install
```

## Dev

```bash
cargo tauri dev
```

## Lint

```bash
pnpm lint        # frontend (ESLint)
pnpm lint:rust   # backend (clippy)
pnpm lint:all    # both
```

## Test

```bash
pnpm test        # frontend (Vitest)
pnpm test:rust   # backend (cargo test)
pnpm test:all    # both
pnpm test:watch  # frontend watch mode
```

## Prod

```bash
cargo tauri build
```

Binary output: `src-tauri/target/release/s3client`
