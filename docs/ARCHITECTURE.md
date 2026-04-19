# Cafe POS — High-level Architecture

> อัปเดตล่าสุด: 2026-04-18

---

## Data Flow หลัก

```
Browser / Tablet
  │
  ├── Client Components (useState, useFetch, Realtime subscription)
  │       ↓  fetch POST/PUT/GET
  ├── Next.js API Routes  /api/{resource}/route.ts
  │       ↓  withHandler → requireAuth → requireRole → Zod parse
  ├── Service Layer  /src/lib/services/*.ts
  │       ↓  business logic + prisma.$transaction()
  ├── Prisma ORM  /src/lib/prisma.ts  (singleton)
  │       ↓  SQL
  └── Supabase PostgreSQL
```

---

## 3 Layers

### 1. Transport Layer — API Routes + Middleware

ทุก request ผ่าน `src/middleware.ts` ก่อนเสมอ — refresh Supabase session token แล้วตรวจว่า user authenticated หรือเปล่า ถ้าไม่มี session → redirect `/login` (page) หรือ 401 (API)

ใน API route แต่ละตัวจะผ่าน `withHandler()` จาก `src/lib/route-handler.ts` ซึ่ง wrap error handling ทั้งหมด (ZodError → 400, ApiError → custom status, unknown → 500) แล้วทุก response กลับเป็น `ApiResponse<T>` รูปแบบเดียวกันหมด

```
Middleware (session refresh + route guard)
  └── withHandler()
        ├── requireAuth()       → 401 if no session
        ├── requireRole()       → 403 if wrong role
        ├── Zod.parse(body)     → 400 if invalid input
        └── handler logic
```

### 2. Business Logic — Service Layer

ไม่ใส่ logic ใน route handler โดยตรง — แยกเป็น service ใน `src/lib/services/`:

**`payment.service.ts`** — ทำ Cash, Card (Omise), PromptPay ด้วย `prisma.$transaction()` ครั้งเดียว (atomic):
- สร้าง Payment record
- สร้าง Receipt record
- update Order.status = `completed`
- update Table.status = `available`

**`order.service.ts`** — สร้าง Order พร้อม OrderItems, generate orderNumber, คำนวณ total

**`email.service.ts`** — ส่ง receipt + daily report ผ่าน Resend (graceful degradation ถ้าไม่มี API key)

### 3. Data Layer — Prisma + Supabase

Domain Model chain: `Menu → Order → OrderItem → Payment → Receipt`

`Table` และ `Staff` เชื่อมกับ `Order`

Deletion rules สะท้อน business logic:
- ลบ Table ได้ → `Order.tableId` เป็น `SetNull`
- ลบ Staff/Menu ไม่ได้ถ้ายังมี Order อ้างอยู่ → `Restrict`
- ลบ Order → `OrderItem` ลบตามอัตโนมัติ → `Cascade`

---

## Domain Model

```
Category
  └── Menu (N:1)

Table ──────────────┐
Staff ──────────────┼── Order
                    │     └── OrderItem (M:1 Menu)
                    │           │
                    └── Payment (1:1)
                          └── Receipt (1:1)
```

### Schema หลัก

| Model | Fields สำคัญ |
|---|---|
| Staff | authId (Supabase UID), role (cashier/barista/admin), isActive |
| Category | name (unique), sortOrder, isActive |
| Menu | categoryId, name, price, isAvailable |
| Table | number (unique), status (available/occupied/reserved) |
| Order | orderNumber (unique), tableId, staffId, status, subtotal, discount, total |
| OrderItem | orderId, menuId, menuName, menuPrice, quantity, lineTotal |
| Payment | orderId (1:1), method, status, amount, gatewayRef, gatewayMeta (JSON) |
| Receipt | orderId (1:1), paymentId (1:1), receiptNumber (unique), data (JSON) |

---

## API Routes

| Route | Methods | Role Required |
|---|---|---|
| `/api/auth/signout` | POST | any |
| `/api/menus` | GET, POST | cashier+ |
| `/api/menus/[id]` | GET, PUT, DELETE | cashier+ |
| `/api/categories` | GET, POST | cashier+ |
| `/api/categories/[id]` | GET, PUT, DELETE | cashier+ |
| `/api/orders` | GET, POST | cashier+ |
| `/api/orders/[id]` | GET, PUT | cashier+ |
| `/api/payment/cash` | POST | cashier+ |
| `/api/payment/card` | POST | cashier+ |
| `/api/payment/promptpay` | POST | cashier+ |
| `/api/payment/mockup` | POST | cashier+ |
| `/api/staff` | GET, POST | admin |
| `/api/staff/[id]` | GET, PUT, DELETE | admin |
| `/api/tables` | GET, POST | cashier+ |
| `/api/tables/[id]` | GET, PUT | cashier+ |
| `/api/cron/daily-report` | POST | CRON_SECRET |

---

## Services สำคัญ

| Service | บทบาท | Entry Point |
|---|---|---|
| Supabase Auth | Session management ผ่าน cookie (`@supabase/ssr`) | `src/lib/supabase/` |
| Supabase Realtime | Subscribe order status updates แบบ live ใน browser | `src/app/(dashboard)/orders/_components/` |
| Omise | Card payment gateway, stores charge meta เป็น JSON | `src/lib/omise-client.ts` |
| Resend + React Email | ส่ง receipt email และ daily report | `src/emails/` |
| Cron | Daily report task, guard ด้วย `CRON_SECRET` | `src/app/api/cron/` |

---

## Patterns สำคัญ

### Auth Guard แบบ Layered

```
Middleware       → page-level session check
requireAuth()    → API-level session + staff record check
requireRole()    → role-specific endpoint guard (cashier/barista/admin)
```

### Zod → TypeScript Type Inference

```typescript
// src/lib/validations/order.ts
export const createOrderSchema = z.object({ ... });

// src/types/index.ts
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
```

Schema นิยามครั้งเดียว — ป้องกัน type drift ระหว่าง validation กับ TypeScript type

### `React.cache()` Request Deduplication

```typescript
// src/lib/auth-helpers.ts
export const getAuthenticatedStaff = cache(async () => { ... });
```

Layout + Page อ้าง `getAuthenticatedStaff()` พร้อมกันได้ โดยไม่เกิด N+1 query

### Server Component First

```
Page.tsx (Server Component)
  ├── ดึง data ผ่าน Prisma โดยตรง (no fetch round-trip)
  └── ส่ง props ลง ClientComponent
        └── useState / useFetch / Realtime subscription
```

### Atomic Payment Transaction

```typescript
await prisma.$transaction([
  prisma.payment.create(...),
  prisma.receipt.create(...),
  prisma.order.update({ status: 'completed' }),
  prisma.table.update({ status: 'available' }),
]);
```

ทุก step สำเร็จหรือ rollback ทั้งหมด — ไม่มี partial state

---

## ไฟล์ Infrastructure หลัก

```
src/
├── middleware.ts                    # Session refresh + route guard
├── lib/
│   ├── prisma.ts                   # Prisma singleton
│   ├── api-auth.ts                 # requireAuth(), requireRole()
│   ├── api-response.ts             # ApiResponse<T> builders
│   ├── api-error.ts                # ApiError class + HTTP helpers
│   ├── route-handler.ts            # withHandler() wrapper
│   ├── auth-helpers.ts             # getAuthenticatedStaff() (cached)
│   ├── omise-client.ts             # Omise payment gateway
│   ├── supabase/
│   │   ├── server.ts               # Server-side Supabase client
│   │   └── client.ts               # Browser-side Supabase client
│   ├── services/
│   │   ├── payment.service.ts      # Cash, Card, PromptPay, Mockup
│   │   ├── order.service.ts        # Order creation
│   │   └── email.service.ts        # Resend integration
│   └── validations/                # Zod schemas (order, payment, menu, ...)
├── types/
│   └── index.ts                    # Central type registry (inferred from Zod)
├── emails/                          # React Email templates
└── prisma/
    └── schema.prisma               # Database schema
```
