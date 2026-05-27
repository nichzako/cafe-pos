# ADR-003: Next.js App Router + Server Components First

**Status:** Accepted  
**Date:** 2026-01-15 (บันทึกย้อนหลัง)

## Context

โปรเจคเริ่มต้นช่วงที่ Next.js 15 App Router เสถียรแล้ว มีตัวเลือก 3 แนว:

1. **Next.js Pages Router** — mature, predictable, แต่ไม่ได้รับ feature ใหม่อีกแล้ว
2. **Next.js App Router** — Server Components, streaming, co-located layouts
3. **Separate frontend (Vite/React SPA) + standalone API** — flexibility สูงสุด แต่ deploy 2 services, CORS, latency เพิ่ม

**POS มี requirement สำคัญ:** pages ส่วนใหญ่ต้องการ auth check ก่อน render — App Router ทำใน middleware + Server Component ได้โดยไม่ต้องทำ client-side redirect ที่ flash ก่อน

**SPA (option 3) ออกตั้งแต่ต้น** เพราะต้อง deploy/maintain 2 services และ session management ซับซ้อนกว่าสำหรับทีมเล็ก

## Decision

ใช้ **Next.js 15 App Router** โดยยึดหลัก **Server Components First**:
- Page.tsx เป็น Server Component เสมอ — query Prisma โดยตรง ไม่ผ่าน fetch round-trip
- ใส่ `'use client'` เฉพาะ component ที่ต้องการ useState/useEffect/event handlers จริงๆ
- Route groups: `(auth)/` และ `(dashboard)/` แยก layout ชัดเจน

เหตุผลหลัก:
- Server Component query DB โดยตรง → ลด network round-trip 1 ครั้งต่อ page load
- Middleware session refresh ทำงานถูกต้องกับ App Router cookie model (`@supabase/ssr`)
- `React.cache()` ใน `getAuthenticatedStaff()` deduplicate DB calls ระหว่าง layout + page ใน request เดียว

## Consequences

**ดี:**
- Initial page load เร็ว — ไม่มี client-side data waterfall
- Auth state ถูกต้องทุก page โดยไม่ต้องทำ client guard
- Bundle size เล็กกว่าเพราะ Server Components ไม่ ship JS ไป browser

**ข้อควรระวัง:**
- Server Actions ไม่ใช้ใน codebase นี้ (ใช้ API Routes แทน) — เหตุผลใน ADR-006
- `'use client'` ต้องระวัง ถ้าใส่ที่ parent จะ force ทุก children เป็น client ด้วย
- Next.js 16 มี breaking changes เรื่อง `proxy.ts` → `middleware.ts` (ดู commit `b87121a` และ `556757a`)
