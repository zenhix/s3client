---
title: Theming & Styling
type: concept
last-updated: 2026-05-10
related: [../architecture/frontend.md]
---

# Theming & Styling

## Color System

All colors use the OkLCH color space, defined as CSS custom properties in `src/index.css`.

Light and dark mode tokens are defined separately:
- `:root` — light mode defaults
- `.dark` — dark mode overrides (via `@custom-variant dark`)

Key token categories: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart (1-5), sidebar variants.

## Tailwind CSS 4

Uses the new `@theme inline` directive to map CSS custom properties to Tailwind tokens. This allows using tokens like `bg-primary`, `text-muted-foreground` directly in classes.

Border radius uses a base `--radius` variable with computed scales (sm through 4xl).

## Dark Mode

Managed by `next-themes` package:
- `ThemeProvider` wraps the app
- Toggle via theme context
- Uses class-based strategy (`.dark` class on root)
- Custom variant: `@custom-variant dark (&:is(.dark *))`

## Typography

- Primary font: Geist Variable (sans-serif) via `@fontsource-variable/geist`
- Applied globally via `--font-sans` and `--font-heading` tokens

## Component Library

shadcn/Base UI components in `src/components/ui/`. Styled with Tailwind classes using `class-variance-authority` (CVA) for variant management and `tailwind-merge` + `clsx` for class composition.

## Animations

`tw-animate-css` provides Tailwind-compatible animation utilities. Imported in `src/index.css`.
