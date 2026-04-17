# Onboarding Guide: Cafe POS

ระบบ Point of Sale สำหรับร้านกาแฟ สร้างด้วย Next.js 15 App Router
รองรับ 3 roles: **cashier** (รับออเดอร์), **barista** (เตรียมเครื่องดื่ม), **admin** (จัดการระบบ)
Optimize สำหรับ tablet/iPad เป็น primary device

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^4 |
| Auth | Supabase Auth (SSR) | ^0.10 |
| Database | PostgreSQL via Supabase | - |
| ORM | Prisma | ^6.x |
| Validation | Zod | ^4 |
| Forms | React Hook Form | ^7 |
| Realtime | Supabase Realtime | - |
| Payment | Omise (card) + PromptPay QR | - |
| Email | React Email + Resend | - |
| Testing | Vitest | ^4 |
| Deploy | Vercel + Supabase | - |

---

## Domain Model

5 entities หลักเชื่อมกันแบบนี้:

```
Category ──< Menu ──< OrderItem >── Order >── Payment ── Receipt
                                       │
                              Table ───┘
                              Staff ───┘
```

- **Category / Menu** — เมนูจัดหมวดหมู่, มี `isAvailable` toggle
- **Table** — โต๊ะลูกค้า, status: `available | occupied | reserved`
- **Order** — ออเดอร์หลัก, status pipeline: `pending → preparing → ready → completed`
- **OrderItem** — snapshots menu name/price ตอน order (ป้องกัน price drift)
- **Payment** — cash / promptpay / card (Omise) / mockup, status: `pending → paid`
- **Receipt** — audit record ถาวร, สร้างหลัง payment paid
- **Staff** — พนักงาน linked กับ Supabase Auth ผ่าน `authId`

> `onDelete: Restrict` บน Payment/Receipt ป้องกัน accidental deletion ของ audit trail

---

## Architecture

```
Browser / Tablet
      │
      ▼
Next.js Middleware (Edge)
  ├── refreshes Supabase session cookies (every request)
  └── redirects unauthenticated users → /login
      │
      ▼
App Router
  ├── (auth)/login        — public, Supabase email+password
  └── (dashboard)/*       — protected
        ├── page.tsx       — Server Component (fetch data)
        └── _components/   — Client Components (interactivity)
              │
              ▼
        API Routes  /api/{resource}/route.ts
              │
              ├── withHandler()     — centralized error catching
              ├── requireAuth()     — Supabase session → Staff record
              ├── requireRole()     — role-based access
              └── lib/services/     — business logic layer
```

---

## Request Lifecycle (ตัวอย่าง POST /api/orders)

```
1. Client (POSClient.tsx) — ส่ง fetch POST /api/orders
2. Middleware              — refresh session cookie (Edge)
3. withHandler()          — wraps handler, catches errors
4. requireAuth()          — ตรวจ Supabase session → load Staff
5. requireRole()          — ตรวจว่าเป็น cashier/admin
6. createOrderSchema.parse(body) — Zod validate input
7. createOrder() service  — business logic
   ├── validate table availability
   ├── fetch menu prices server-side (never trust client prices)
   ├── calculate totals
   └── Prisma transaction: Order + OrderItems + update Table status
8. createdResponse()      — ApiResponse<T> { success: true, data }
```

---

## Directory Map

```
src/
├── app/
│   ├── (auth)/login/           — หน้า login + Server Action
│   ├── (dashboard)/
│   │   ├── pos/                — หน้าหลัก POS (รับออเดอร์)
│   │   ├── orders/             — ดูสถานะออเดอร์ (+ realtime)
│   │   ├── menu/               — จัดการเมนู (admin)
│   │   ├── tables/             — จัดการโต๊ะ
│   │   └── staff/              — จัดการพนักงาน (admin)
│   └── api/
│       ├── orders/             — CRUD orders
│       ├── menus/              — CRUD menus
│       ├── payment/{method}/   — cash / promptpay / card / mockup
│       ├── staff/              — CRUD staff
│       ├── tables/             — CRUD tables
│       ├── categories/         — CRUD categories
│       ├── auth/signout/       — logout
│       └── cron/daily-report/  — รายงานประจำวัน (via CRON_SECRET)
├── components/ui/              — shared UI: Button, Modal, Badge, Input, Skeleton, EmptyState
├── hooks/
│   └── useOrdersRealtime.ts    — Supabase Realtime subscription
├── lib/
│   ├── route-handler.ts        — withHandler() wrapper
│   ├── api-auth.ts             — requireAuth(), requireRole()
│   ├── api-response.ts         — successResponse(), errorResponse(), paginatedResponse()
│   ├── api-error.ts            — ApiError, badRequest(), notFound(), unauthorized(), forbidden()
│   ├── prisma.ts               — singleton PrismaClient
│   ├── supabase/               — client.ts (browser) + server.ts (SSR)
│   ├── auth-helpers.ts         — server-side session helpers
│   ├── omise-client.ts         — Omise payment gateway wrapper
│   ├── validations/            — Zod schemas per resource
│   └── services/               — business logic (order, payment, email)
├── types/index.ts              — central type registry (inferred from Zod)
├── emails/                     — React Email templates
└── middleware.ts               — Edge: session refresh + route guard
prisma/
├── schema.prisma               — data model source of truth
├── rls-setup.sql               — Supabase RLS policies
└── realtime-setup.sql          — Supabase Realtime publication config
```

---

## Key Patterns

### API Route pattern
```ts
// src/app/api/{resource}/route.ts
export const GET = withHandler(async (req) => {
  const staff = await requireAuth(req);          // throws 401 if no session
  requireRole(staff, ["admin", "cashier"]);      // throws 403 if wrong role
  const data = await prisma.resource.findMany();
  return successResponse(data);
});
```

### Zod → Type pattern
```ts
// 1. Define schema in src/lib/validations/{resource}.ts
export const createMenuSchema = z.object({ ... });

// 2. Infer type in src/types/index.ts
export type CreateMenuFormData = z.infer<typeof createMenuSchema>;

// 3. Use in component
const form = useForm<CreateMenuFormData>({ resolver: zodResolver(createMenuSchema) });
```

### Server Component + Client split
```
menu/page.tsx           → Server Component: fetch data from Prisma
menu/_components/
  MenuListClient.tsx    → 'use client': state, handlers, mutation
  MenuCard.tsx          → pure presentational
  MenuFormModal.tsx     → 'use client': form (React Hook Form)
```

### Page loading states
ทุก feature มี `loading.tsx` (Skeleton) และ `error.tsx` (Thai error message) คู่กัน

---

## Environment Variables

คัดลอก `.env.example` → `.env.local` แล้วกรอกค่า:

| Variable | ใช้ที่ไหน |
|---|---|
| `DATABASE_URL` | Prisma (pooled, pgBouncer) |
| `DIRECT_URL` | Prisma migrate (direct) |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | server only |
| `NEXT_PUBLIC_OMISE_PUBLIC_KEY` | card tokenization (browser) |
| `OMISE_SECRET_KEY` | Omise API (server only) |
| `PROMPTPAY_ID` | QR generation |
| `RESEND_API_KEY` | email sending |
| `CRON_SECRET` | protect cron endpoints |
| `ENABLE_MOCKUP_GATEWAY` | dev payment bypass |

---

## Common Tasks

| ต้องการทำอะไร | คำสั่ง |
|---|---|
| Start dev server | `npm run dev` |
| Type check + build | `npm run build` |
| Lint | `npm run lint` |
| Run tests | `npm test` |
| DB GUI | `npx prisma studio` |
| Regen Prisma client | `npx prisma generate` |
| Migrate DB | `npx prisma migrate dev --name <name>` |

---

## Where to Look

| ต้องการ... | ดูที่... |
|---|---|
| เพิ่ม API endpoint | `src/app/api/{resource}/route.ts` |
| เพิ่มหน้าใหม่ (dashboard) | `src/app/(dashboard)/{feature}/page.tsx` |
| เพิ่ม UI component ใช้ร่วมกัน | `src/components/ui/` |
| เพิ่ม feature component | `src/app/(dashboard)/{feature}/_components/` |
| แก้ validation rule | `src/lib/validations/{resource}.ts` |
| เพิ่ม type ใหม่ | `src/types/index.ts` |
| Business logic | `src/lib/services/` |
| Payment flow | `src/app/api/payment/` + `src/lib/services/payment.service.ts` |
| Auth flow | `src/middleware.ts` + `src/lib/api-auth.ts` + `src/lib/auth-helpers.ts` |
| Database schema | `prisma/schema.prisma` |
| Email template | `src/emails/` |

---

## Conventions

- **No `any`** — ใช้ `unknown` แล้ว narrow
- **Named exports เท่านั้น** — ยกเว้น Next.js page/layout ที่บังคับ
- **Server Components first** — ใส่ `'use client'` เฉพาะที่ต้องใช้ hooks/events
- **Thai error messages** — ทุก API route return Thai message ผ่าน `ApiResponse`
- **Prices always server-side** — ไม่ trust client-sent prices
- **Component ≤ 200 บรรทัด** — ถ้าเกินให้แยก
- **ทุก interactive element** ต้องมี loading / empty / error / success / unauthorized state

---

## Security Notes

- **ห้ามแก้** `src/middleware.ts`, `src/lib/supabase/`, `src/lib/auth-helpers.ts` โดยไม่ approve
- **ห้ามแก้** `src/app/api/payment/` โดยไม่ review
- **ห้ามปิด Supabase RLS** บน table ใด ๆ
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `OMISE_SECRET_KEY` — server only เท่านั้น
- ดู `prisma/rls-setup.sql` สำหรับ Row Level Security policies
