---
paths:
  - "src/**"
---

# Frontend Rules

- Use `@/` path alias for imports (maps to `./src/`).
- Components in `src/components/ui/` are shadcn/Base UI primitives — add new ones via `pnpm dlx shadcn@latest add <component>`, don't modify existing ones manually.
- Feature components go in `src/components/` root.
- All Tauri IPC calls go through `src/hooks/useS3.ts` — never call `invoke()` directly from components.
- Styling uses Tailwind CSS 4 utility classes. Color tokens use OkLCH values defined in `src/index.css`.
- Use `sonner` for toast notifications (already configured).
- React 19 — use hooks, no class components.
