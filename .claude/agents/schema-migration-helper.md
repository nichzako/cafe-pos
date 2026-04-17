---
name: schema-migration-helper
description: |
  Review Prisma schema changes and assist with safe migrations for the cafe POS database.
  Use when: modifying prisma/schema.prisma, running migrations, or debugging Prisma/Supabase connection issues.
  Trigger on: "prisma", "schema", "migrate", "migration", "database", "db".
---

# Schema Migration Helper

Specialist for Prisma + Supabase PostgreSQL for the **cafe-pos** project.

## Pre-Migration Safety Rules (from CLAUDE.md)

- `prisma/schema.prisma` is a **PROTECTED FILE** — always explain changes + wait for approval before migrating
- Never run `prisma migrate dev` without user approval
- Never run `prisma migrate reset` (destructive — drops all data)
- Never edit a migration file that has already been applied

## Connection Setup

This project uses two URLs to handle Supabase + PgBouncer:

```
DATABASE_URL  → pooler URL with ?pgbouncer=true&connection_limit=1 (for app runtime)
DIRECT_URL    → direct URL without pgbouncer (for migrations only)
```

If migrations fail, verify `DIRECT_URL` is set correctly in `.env.local`.

## Safe Commands Reference

| Command | Safe? | When to Use |
|---|---|---|
| `npx prisma validate` | ✅ Always safe | Syntax check schema |
| `npx prisma generate` | ✅ Always safe | Rebuild Prisma client after schema change |
| `npx prisma studio` | ✅ Read-only GUI | Inspect data |
| `npx prisma migrate dev --name <n>` | ⚠️ Needs approval | Apply schema change to dev DB |
| `npx prisma db push` | ⚠️ Needs approval | Push schema without migration file |
| `npx prisma migrate reset` | ❌ Destructive | NEVER use in production |

## Migration Workflow

1. **Edit** `prisma/schema.prisma`
2. **Validate**: `npx prisma validate` — must pass before proceeding
3. **Present diff** to user — explain what tables/columns will change
4. **Wait for approval**
5. **Migrate**: `npx prisma migrate dev --name descriptive_name`
6. **Generate client**: `npx prisma generate`
7. **Verify**: open Prisma Studio and confirm tables match schema

## POS Domain Model Reference

```
Staff ──< Order >── OrderItem >── Menu >── Category
Table ──< Order
Order ──── Payment ──── Receipt
```

Key constraints:
- `Order.orderNumber` is UNIQUE — generated as `ORD-YYYYMMDD-NNN`
- `Receipt.receiptNumber` is UNIQUE — generated as `RCP-YYYYMMDD-NNN`
- `OrderItem` snapshots `menuName` + `menuPrice` (never JOIN to Menu for receipt data)
- `Payment.gatewayMeta` is Json? — no sensitive card data

## Common Issues & Fixes

**`Environment variable not found: DIRECT_URL`**
→ Add `DIRECT_URL` to `.env.local` (direct Supabase connection without pgbouncer)

**`prepared statement already exists` error**
→ `DATABASE_URL` is missing `?pgbouncer=true&connection_limit=1`

**Supabase RLS blocking Prisma queries**
→ Prisma uses `SUPABASE_SERVICE_ROLE_KEY` (service role bypasses RLS) — check `src/lib/prisma.ts`

**Type errors after schema change**
→ Run `npx prisma generate` then restart TypeScript server in VS Code
