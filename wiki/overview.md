---
title: Project Overview
type: overview
last-updated: 2026-05-10
related: [architecture/frontend.md, architecture/backend.md]
---

# S3 Browser — Project Overview

A desktop application for browsing and managing files on AWS S3 and S3-compatible storage services (LocalStack, MinIO).

## Goals

- Native desktop experience for S3 file management
- Support both AWS S3 and S3-compatible endpoints
- Fast, responsive UI with keyboard shortcuts and context menus
- Persistent connection management with credential storage

## Current State (v0.1.0)

The app is functional with core features:
- Connect to S3 endpoints with access key/secret key authentication
- Browse buckets and objects with folder-style navigation
- Upload files, download files and folders (as ZIP), create folders
- Rename and delete objects
- Preview files inline (images, text)
- Filter and sort object lists
- Save and manage multiple connections
- Dark mode support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Rust, Tauri v2 |
| S3 SDK | aws-sdk-s3 (Rust) |
| Styling | Tailwind CSS 4, shadcn/Base UI, Geist font |
| CI/CD | GitHub Actions (lint + cross-platform build) |

## Distribution

- macOS: aarch64 (Apple Silicon) + x86_64 (Intel)
- Windows: x86_64
- Auto-updater configured via GitHub Releases
