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

## Prod

```bash
cargo tauri build
```

Binary output: `src-tauri/target/release/s3client`
