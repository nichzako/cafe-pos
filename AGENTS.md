# Agent Instructions — Cafe POS

For full project conventions, see **CLAUDE.md** and **.claude/agents/**.

## Important: Next.js 16 Breaking Changes

This project uses Next.js 16 which has breaking changes from earlier versions.
APIs, conventions, and file structure may differ from training data.

- Read `node_modules/next/dist/docs/` for version-specific behavior
- Heed deprecation notices in build output
- Turbopack is now the default for `next dev` — do not add `--turbopack` flag
- App Router is the only supported routing approach in this project
- `next/font` must be used for fonts — not CSS `@import url(...)`
