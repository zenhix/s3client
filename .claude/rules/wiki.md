---
paths:
  - "wiki/**"
---

# Wiki Maintenance Rules

- The wiki is an LLM-maintained knowledge base. Follow conventions in `wiki/schema.md`.
- Every wiki page must have YAML frontmatter with `title`, `type`, `last-updated`, and `related` fields.
- After creating or updating wiki pages, update `wiki/index.md` with a link and one-line summary.
- Log significant operations (ingests, major updates, lint passes) in `wiki/log.md` with format: `## [YYYY-MM-DD] action | Description`.
- Use relative markdown links for cross-references between wiki pages.
- Never modify files in `wiki/sources/` — those are immutable raw sources.
- Architecture and concept pages should reflect the current state of the code, not aspirational designs.
