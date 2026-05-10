---
title: Wiki Schema
type: schema
last-updated: 2026-05-10
related: [index.md, log.md]
---

# Wiki Schema

This document defines the conventions, page types, and workflows for maintaining the S3 Browser wiki.

## Page Types

| Type | Directory | Purpose |
|------|-----------|---------|
| **overview** | `wiki/` | High-level project state and goals |
| **architecture** | `wiki/architecture/` | System design, component structure, data flow |
| **concept** | `wiki/concepts/` | Domain concepts, features, patterns |
| **decision** | `wiki/decisions/` | Architecture Decision Records (ADRs) |
| **source-summary** | `wiki/sources/` | Summaries of ingested raw sources |

## Frontmatter Format

Every wiki page must include YAML frontmatter:

```yaml
---
title: Page Title
type: architecture | concept | decision | overview | source-summary
last-updated: YYYY-MM-DD
related: [relative/path/to/page.md, another/page.md]
---
```

## Cross-Referencing

Use relative markdown links: `[Connection Lifecycle](../concepts/connections.md)`
Keep links bidirectional — if page A links to page B, page B should link back to A.

## Special Files

- **index.md** — Catalog of all pages. One line per entry: `- [Title](path) — one-line summary`. Updated on every page create/update.
- **log.md** — Chronological append-only log. Format: `## [YYYY-MM-DD] action | Description`. Actions: `ingest`, `update`, `create`, `lint`, `query`.
- **schema.md** — This file. Defines wiki conventions.

## Workflows

### Ingest
1. Place raw source in `wiki/sources/` (immutable after placement)
2. Read the source and discuss key takeaways
3. Write a source-summary page
4. Update relevant architecture/concept pages with new information
5. Update `index.md` with new/changed pages
6. Append entry to `log.md`

### Query
1. Read `index.md` to find relevant pages
2. Read the relevant pages
3. Synthesize an answer
4. If the answer is reusable, file it as a new concept or decision page
5. Update `index.md` and `log.md`

### Lint
1. Check for contradictions between pages
2. Identify orphan pages (not in index, no inbound links)
3. Find stale claims superseded by code changes
4. Flag missing pages for mentioned-but-unlinked concepts
5. Verify frontmatter completeness
6. Log the lint pass in `log.md`

## Naming Conventions

- Use kebab-case for filenames: `ci-cd.md`, `s3-operations.md`
- Keep filenames short and descriptive
- Decisions use prefix: `NNN-title.md` (e.g., `001-use-tauri-v2.md`)
