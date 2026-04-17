# CLAUDE.md — Cafe POS Project

## Project Overview

**Cafe POS** — ระบบ Point of Sale สำหรับร้านกาแฟ สร้างด้วย Next.js 15 App Router
กลุ่มเป้าหมาย: เจ้าของร้านกาแฟและพนักงานที่ต้องการจัดการออเดอร์ เมนู และยอดขายแบบ Real-time
Optimize สำหรับ: Mobile-first UX บน tablet/iPad, รองรับหลาย Role (cashier, barista, admin)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 3.4 |
| Auth | Supabase Auth (OAuth + SSR) |
| Database | PostgreSQL via Supabase + Prisma 6.x |
| Validation | Zod 4 (Thai error messages) |
| Forms | React Hook Form 7 |
| Realtime | Supabase Realtime (order status updates) |
| Email | React Email + Resend |
| Icons | Lucide React |
| Deploy | Vercel (Node.js 22.x runtime) + Supabase |

**ห้ามใช้:** Redux, Zustand, Material UI, Chakra UI, Axios — ห้ามเพิ่ม library ใหม่โดยไม่ได้รับอนุมัติ

---

## Architecture — Where New Things Go

| สร้างอะไร | ไปไว้ที่ไหน |
|---|---|
| Page ใหม่ (protected) | `src/app/(dashboard)/{feature}/page.tsx` |
| Page ใหม่ (public/auth) | `src/app/(auth)/{feature}/page.tsx` |
| API route ใหม่ | `src/app/api/{resource}/route.ts` — ห้ามสร้าง top-level folder ใหม่โดยไม่ถาม |
| UI component (reusable) | `src/components/ui/` |
| Feature-specific component | `src/app/(dashboard)/{feature}/_components/` |
| Zod schema | `src/lib/validations/{resource}.ts` |
| Type ใหม่ | `src/types/index.ts` — เพิ่มในไฟล์เดิม |
| Utility function | `src/lib/` |
| Email template | `src/emails/` |
| Prisma client singleton | `src/lib/prisma.ts` — ใช้ที่เดียว |

### Decision Rules

- **แก้ของเก่าก่อนเสมอ** — สร้างใหม่เมื่อ logic ต่างกัน >50% หรือ component เกิน 200 บรรทัด
- **Naming:** files → kebab-case, components → PascalCase, variables → camelCase, types → PascalCase + context prefix (`OrderFormData`), Zod → camelCase + `Schema` suffix

---

## Domain Model (POS Core)

ระบบหลักมี 5 entities:

`Menu` → `Order` → `OrderItem` → `Payment` → `Receipt`

และ `Table` (โต๊ะ) เชื่อมกับ `Order`, `Staff` (พนักงาน) เชื่อมกับ `Order` + `Payment`

---

## Coding Conventions

- **No `any`** — ใช้ `unknown` แล้ว narrow type
- **Named exports only** — ห้าม `export default` ยกเว้น Next.js page/layout ที่บังคับ
- **Async/await เท่านั้น** — ห้าม `.then()/.catch()` chains
- **Server Components first** — ใส่ `'use client'` เฉพาะ component ที่ใช้ hooks/events จริง ๆ
- **Zod validation ทุก API route** — validate input ด้วย schema จาก `lib/validations/` ก่อน process
- **Prisma singleton** — ใช้ `lib/prisma.ts` เท่านั้น ห้าม `new PrismaClient()` ที่อื่น
- **API response format** — ใช้ `ApiResponse<T>` จาก `types/index.ts` เสมอ
- **Component ไม่เกิน 200 บรรทัด** — ถ้าเกินให้แยก sub-components
- **Error handling** — ทุก API route ต้อง try/catch + return Thai error message ผ่าน `ApiResponse`

---

## UI & Design System

- ใช้ custom components ใน `src/components/ui/` เท่านั้น — ห้ามเพิ่ม UI library ภายนอก
- Tailwind utility classes เท่านั้น — ห้ามเขียน custom CSS files ยกเว้น `globals.css`
- **Mobile-first responsive** — เริ่มจาก mobile, ใช้ `sm:` `md:` `lg:` ขึ้นไป
- ห้าม hardcode hex colors — ใช้ Tailwind color palette จาก `tailwind.config`
- Icons: **Lucide React เท่านั้น**
- ทุก interactive element ต้องมี `aria-label`, hover + focus + disabled states
- **POS Layout:** Order panel (ซ้าย) + Menu grid (ขวา) — ออกแบบสำหรับ 10-inch tablet ขึ้นไป

---

## Content & Copy (ภาษาไทย)

UI ทั้งหมดใช้ภาษาไทย — Tone: สุภาพ เป็นกันเอง ชัดเจน เหมาะกับการทำงานจริง

| หมวด | กฎ | ตัวอย่าง |
|---|---|---|
| CTA | ใช้ action verbs | ✅ "เพิ่มรายการ" "ชำระเงิน" ❌ "ตกลง" "ดำเนินการ" |
| Error | บอกปัญหา + แนะวิธีแก้ | ✅ "สินค้าหมด — กรุณาเลือกเมนูอื่น" ❌ "เกิดข้อผิดพลาด" |
| Empty state | แนะนำ action | ✅ "ยังไม่มีรายการ — เลือกเมนูเพื่อเริ่มออเดอร์" |
| ราคา | ฿X,XXX หรือ X,XXX บาท | ✅ "฿85" หรือ "85 บาท" |
| เวลา | HH:MM น. | ✅ "14:30 น." |

---

## Testing & Quality — Checklist ก่อน Complete

1. `npm run build` ผ่าน — ไม่มี TypeScript errors
2. `npm run lint` ผ่าน — ไม่มี ESLint warnings
3. ตรวจ 5 states เสมอ: **Loading** (Skeleton), **Empty** (CTA), **Error** (Thai msg), **Success** (feedback), **Unauthorized** (redirect login)
4. ตรวจ responsive บน tablet (768px+) เนื่องจากเป็น primary device ของ POS

---

## Safety Rules

**ห้ามแก้ไขโดยไม่ได้รับอนุมัติ — อธิบาย + รอ approval ก่อน implement เสมอ:**

- `src/middleware.ts` — session refresh + route protection
- `src/lib/supabase/` — ทุกไฟล์ auth-related
- `src/lib/auth-helpers.ts` + `src/app/api/auth/` — authentication flow
- `prisma/schema.prisma` — ต้อง review ก่อน migrate
- `src/app/api/payment/` — payment processing logic
- `src/app/api/cron/` — cron job logic (daily report, etc.)
- `vercel.json`, `next.config.ts` — deployment + security headers

---

## Security Rules

- **ห้าม commit `.env`** หรือไฟล์ที่มี secrets ทุกกรณี
- **ห้าม log sensitive data:** token, API key, payment data — ทุก environment
- **Server-side only:** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` — ห้ามใช้ใน client code
- **ห้ามปิด Supabase RLS** บน table ใด ๆ
- **ทุก API route ต้องมี auth check** + role check (`cashier` / `barista` / `admin`)
- **ห้าม hardcode secrets** — ใช้ environment variables เท่านั้น

---

## Commands

```bash
npm run dev          # Dev server → localhost:3000
npm run build        # Production build + typecheck
npm run lint         # ESLint
npx prisma studio    # DB GUI (safe, read-only)
npx prisma generate  # Regen client (safe หลัง schema change)
npx prisma migrate dev --name <n>  # ต้อง review schema ก่อน
```
