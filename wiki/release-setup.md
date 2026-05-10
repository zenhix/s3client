# Release & Signing Setup

Step-by-step guide to configure CI/CD, code signing, and auto-updates for s3client.

---

## 1. Generate Tauri Updater Keys

The updater uses a keypair to sign and verify updates.

```bash
pnpm tauri signer generate -w ~/.tauri/s3client.key
```

This creates two files:
- `~/.tauri/s3client.key` — private key (keep secret)
- `~/.tauri/s3client.key.pub` — public key

Copy the **public key** content and paste it into `src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/zenhix/s3client/releases/latest/download/latest.json"
    ],
    "pubkey": "PASTE_YOUR_PUBLIC_KEY_HERE"
  }
}
```

---

## 2. macOS Code Signing

### 2.1 Get an Apple Developer Certificate

1. Go to [Apple Developer](https://developer.apple.com/account/resources/certificates/list)
2. Create a **Developer ID Application** certificate
3. Download the `.cer` file and install it in Keychain Access

### 2.2 Export as .p12

1. Open **Keychain Access**
2. Find your "Developer ID Application" certificate
3. Right-click > **Export Items** > save as `.p12` with a password

### 2.3 Base64 encode the .p12

```bash
base64 -i certificate.p12 | pbcopy
```

### 2.4 Create an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in > **App-Specific Passwords** > Generate
3. Save the password

### 2.5 Find your Team ID

1. Go to [Apple Developer Membership](https://developer.apple.com/account/#/membership/)
2. Copy your **Team ID**

### 2.6 Find your Signing Identity

```bash
security find-identity -v -p codesigning
```

Copy the identity string (e.g., `Developer ID Application: Your Name (TEAMID)`)

---

## 3. Windows Code Signing (Optional)

For Windows, the Tauri updater signing key (`TAURI_SIGNING_PRIVATE_KEY`) is sufficient for update verification. For EV code signing (to avoid SmartScreen warnings), you'll need a code signing certificate from a CA like DigiCert.

---

## 4. Add GitHub Secrets

Go to your repo > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

### Required for all releases

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/s3client.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password you set when generating the key |

### Required for macOS signing & notarization

| Secret | Value |
|--------|-------|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12` file |
| `APPLE_SIGNING_IDENTITY` | e.g., `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password from Step 2.4 |
| `APPLE_TEAM_ID` | Your 10-character Team ID |

---

## 5. Update the Updater Endpoint

In `src-tauri/tauri.conf.json`, update the endpoint URL to match your GitHub repo:

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/YOUR_ORG/YOUR_REPO/releases/latest/download/latest.json"
    ],
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

For channel-specific updates (alpha/beta), users on pre-release channels will need a different endpoint or the app can check pre-releases via the GitHub API.

---

## 6. Publishing a Release

### Via GitHub Actions UI

1. Go to **Actions** > **Publish** > **Run workflow**
2. Select options:
   - **Version bump**: `patch`, `minor`, or `major`
   - **Release channel**: `stable`, `beta`, or `alpha`
   - **Target platform**: `all`, `macos`, or `windows`
3. Click **Run workflow**

### What happens

1. Version is bumped in `package.json`, `tauri.conf.json`, and `Cargo.toml`
2. A git tag is created (e.g., `v1.2.3` or `v1.2.3-beta.202605091234`)
3. Tauri builds the app for selected platforms
4. macOS builds are signed and notarized (if secrets are configured)
5. A GitHub Release is created with:
   - `.dmg` / `.app.tar.gz` for macOS (aarch64 + x86_64)
   - `.msi` / `.exe` for Windows
   - `latest.json` for the auto-updater
6. `stable` releases are marked as latest; `beta`/`alpha` are marked as pre-release

### Version format

| Channel | Example |
|---------|---------|
| stable | `1.2.3` |
| beta | `1.2.3-beta.202605091234` |
| alpha | `1.2.3-alpha.202605091234` |

---

## 7. CI (Pull Request Checks)

Every PR to `main` automatically runs:

1. **Frontend lint** — TypeScript type checking (`tsc --noEmit`)
2. **Rust lint** — `cargo fmt --check`, `cargo clippy -D warnings`
3. **Test build** — Full Tauri build on macOS (aarch64 + x86_64) and Windows

---

## 8. Checklist

- [ ] Generate Tauri signer keys (`pnpm tauri signer generate`)
- [ ] Add public key to `tauri.conf.json` `plugins.updater.pubkey`
- [ ] Export macOS Developer ID certificate as `.p12`
- [ ] Base64 encode the `.p12`
- [ ] Create Apple app-specific password
- [ ] Add all secrets to GitHub repo settings
- [ ] Update updater endpoint URL in `tauri.conf.json`
- [ ] Test with a `patch` + `alpha` release first
- [ ] Verify auto-updater works by running an older version
