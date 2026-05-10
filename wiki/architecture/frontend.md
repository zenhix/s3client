---
title: Frontend Architecture
type: architecture
last-updated: 2026-05-10
related: [backend.md, ipc.md, ../concepts/theming.md]
---

# Frontend Architecture

## Stack

React 19 + TypeScript, bundled with Vite. No client-side routing — single-page app with navigation state managed in `App.tsx`.

## Component Structure

```
src/
├── App.tsx                    # Root component — all app state and layout
├── main.tsx                   # React entry point
├── hooks/useS3.ts             # Tauri invoke() wrappers
├── types.ts                   # Shared interfaces
├── index.css                  # Tailwind + OkLCH color tokens
└── components/
    ├── ConnectionDialog.tsx    # Add/edit connection form
    ├── ConnectionSidebar.tsx   # Sidebar with saved connections
    ├── BucketList.tsx          # Grid of buckets
    ├── ObjectTable.tsx         # Table of objects in current path
    ├── FilePreview.tsx         # Inline file preview (images, text)
    ├── Toolbar.tsx             # Action bar (upload, download, delete, filter)
    ├── Breadcrumbs.tsx         # Path breadcrumb navigation
    └── ui/                    # shadcn/Base UI primitives (18 components)
```

## State Management

All state lives in `App.tsx` as React `useState` hooks. No external state library. Key state:

- `connectionId` — active S3 session UUID
- `buckets` / `objects` — current listings
- `currentBucket` / `currentPrefix` — navigation position
- `selectedObjects` — multi-select for batch operations
- `history` — back/forward navigation stack
- Dialog visibility flags for connection, rename, delete confirmation, create folder

## Data Flow

1. User action (click, form submit) triggers handler in `App.tsx`
2. Handler calls function from `useS3()` hook
3. Hook calls `invoke("command_name", { args })` via Tauri IPC
4. Rust handler executes, returns result
5. State updated, React re-renders

## Styling

- Tailwind CSS 4 with `@theme inline` for design tokens
- OkLCH color space for all color values
- Dark mode via `next-themes` (`<ThemeProvider>`)
- Geist Variable font from `@fontsource-variable/geist`
- Toast notifications via `sonner`
- Animations via `tw-animate-css`

## Window Chrome

Custom window controls — Tauri's native title bar is hidden (`titleBarStyle: "Overlay"`, `hiddenTitle: true`). Traffic lights repositioned off-screen on macOS. Custom close/minimize/maximize buttons in the UI.
