---
name: pos-feature-builder
description: |
  Build new POS features following the cafe-pos CLAUDE.md conventions strictly.
  Use when: implementing a new page, API route, component, or Server Action for the cafe POS system.
  Trigger on: "สร้าง feature", "implement", "add", "build" + any POS-related noun (order, menu, payment, table, receipt, staff).
---

# POS Feature Builder

You are a specialist for the **cafe-pos** project. Always read `CLAUDE.md` and the plan file at `.claude/plans/` before doing anything.

## Constraints (from CLAUDE.md — non-negotiable)

- **Named exports only** — `export default` only for Next.js pages/layouts/routes
- **No `any`** — use `unknown` + narrow
- **Async/await only** — no `.then()/.catch()` chains
- **Server Components first** — `'use client'` only when hooks/events needed
- **Component ≤ 200 lines** — split if larger
- **Zod validation** on every API route input
- **`ApiResponse<T>`** on every API route response
- **Thai UI copy** — all labels, errors, empty states in Thai
- **No new libraries** without approval

## File Placement Rules

| What | Where |
|---|---|
| Protected page | `src/app/(dashboard)/{feature}/page.tsx` |
| Auth page | `src/app/(auth)/{feature}/page.tsx` |
| API route | `src/app/api/{resource}/route.ts` |
| Reusable UI | `src/components/ui/` |
| Feature component | `src/app/(dashboard)/{feature}/_components/` |
| Zod schema | `src/lib/validations/{resource}.ts` |
| New type | `src/types/index.ts` (append, don't create new file) |
| Utility | `src/lib/` |

## Workflow

1. **Read** `CLAUDE.md` and relevant existing files before writing anything
2. **Check** `src/types/index.ts` — reuse existing types, don't duplicate
3. **Write Zod schema** in `src/lib/validations/` first
4. **Write types** in `src/types/index.ts`
5. **Write API route** (if needed) following the standard try/catch pattern
6. **Write components** — Server Component by default
7. **Run** `npm run build` to verify no TypeScript errors
8. **Run** `npm run lint` to verify no ESLint warnings

## API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStaffSession, requireRole } from '@/lib/auth-helpers'
import { yourSchema } from '@/lib/validations/your-resource'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { staff } = await getStaffSession(request)
    requireRole(staff, ['cashier', 'admin'])

    const body: unknown = await request.json()
    const validated = yourSchema.parse(body)

    // ... logic ...

    return NextResponse.json<ApiResponse<ResultType>>({ success: true, data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
```

## 5-State Checklist (every page/component)

Before marking complete, verify all 5 states exist:
- **Loading** — Skeleton placeholder
- **Empty** — Thai message + action CTA
- **Error** — Thai message with guidance
- **Success** — Positive feedback (toast/inline)
- **Unauthorized** — Redirect or 403 page
