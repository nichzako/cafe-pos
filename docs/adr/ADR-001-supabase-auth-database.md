# ADR-001: Supabase เป็น Auth และ Database

**Status:** Accepted  
**Date:** 2026-01-15 (บันทึกย้อนหลัง)

## Context

ระบบ POS ต้องการ 3 สิ่งพร้อมกัน:
1. Auth ที่รองรับ SSR (Next.js App Router อ่าน session ฝั่ง server ก่อน render)
2. PostgreSQL ที่ต้องการ relational schema (Order → OrderItem → Payment → Receipt)
3. Realtime subscription สำหรับ order status updates บน orders list

ตัวเลือกที่พิจารณา: Firebase (Auth + Firestore), Supabase, custom Auth + AWS RDS

**Firebase ออกตั้งแต่ต้น** เพราะ Firestore เป็น NoSQL — relational schema ของ POS (cascade delete, foreign key constraints, Decimal precision สำหรับราคา) ทำได้ยากและไม่ natural

**Custom Auth + RDS** ต้องการ infra เพิ่ม (session store, token rotation) และ Realtime ต้องสร้างเอง — cost สูงเกินสำหรับ scale ของโปรเจคนี้

## Decision

ใช้ **Supabase** เป็นทั้ง Auth (SSR via `@supabase/ssr`) และ Database (PostgreSQL ผ่าน Prisma)

เหตุผลหลัก:
- `@supabase/ssr` ออกแบบมาสำหรับ Next.js App Router โดยเฉพาะ — refresh session token ใน middleware ได้ถูกต้อง
- PostgreSQL รองรับ schema เดิมทุกอย่างโดยไม่ต้องประนีประนอม
- Supabase Realtime ใช้ PostgreSQL LISTEN/NOTIFY — ไม่ต้องสร้าง WebSocket server แยก
- RLS (Row Level Security) เป็น defense-in-depth ชั้นที่ 2 นอกจาก API-level auth
- Managed service → ไม่ต้องดูแล infra เอง

## Consequences

**ดี:**
- Session refresh ใน middleware ทำงานถูกต้องกับ App Router
- Schema flexible เพราะเป็น PostgreSQL จริง
- Realtime ได้ทันทีโดยไม่มี infra เพิ่ม

**ข้อควรระวัง:**
- Connection pooling ต้องแยก `DATABASE_URL` (PgBouncer) กับ `DIRECT_URL` (migrations) — ดู `.env.example`
- `SUPABASE_SERVICE_ROLE_KEY` ต้อง server-side only เสมอ — ห้ามใช้ใน client components
- ถ้า migrate ออกจาก Supabase Auth ทีหลัง — `Staff.authId` ผูกกับ Supabase UID ต้องเขียน migration
