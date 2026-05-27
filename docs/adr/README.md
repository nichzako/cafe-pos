# Architecture Decision Records

บันทึก decisions ระดับ architecture ที่มี impact สูงและ cost-to-change สูง  
ทุก ADR ตอบ "ทำไม" ไม่ใช่แค่ "เลือกอะไร"

| # | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-supabase-auth-database.md) | Supabase เป็น Auth และ Database | Accepted |
| [ADR-002](ADR-002-prisma-orm.md) | Prisma ORM แทน Drizzle / raw SQL | Accepted |
| [ADR-003](ADR-003-nextjs-app-router-server-components.md) | Next.js App Router + Server Components First | Accepted |
| [ADR-004](ADR-004-vercel-singapore-region.md) | Deploy บน Vercel ที่ Singapore Region | Accepted |
| [ADR-005](ADR-005-omise-payment-gateway.md) | Omise เป็น Payment Gateway | Accepted |

## เมื่อไหร่ควรเพิ่ม ADR ใหม่

เพิ่มเมื่อ decision นั้น:
- **Irreversible หรือ cost-to-change สูง** — เปลี่ยน database, เปลี่ยน auth provider, เปลี่ยน payment gateway
- **Impact > 1 service** — แก้แล้วกระทบหลายส่วนของ codebase
- **มี trade-off ที่ไม่ obvious** — future-self ต้อง understand context ถึงจะ maintain ได้ถูกต้อง

## Format

```markdown
# ADR-XXX: [Title]

**Status:** Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD

## Context
[ทำไมถึงต้องตัดสินใจ — constraints, ตัวเลือก, เหตุผลที่ตัดตัวเลือกอื่นออก]

## Decision
[เลือกอะไร และเหตุผลหลัก]

## Consequences
[ผลดี + ข้อควรระวัง]
```
