# ADR-002: Prisma ORM แทน Drizzle / raw SQL

**Status:** Accepted  
**Date:** 2026-01-15 (บันทึกย้อนหลัง)

## Context

โปรเจคต้องการ type-safe database access บน TypeScript + PostgreSQL ตัวเลือกหลักที่พิจารณา: Prisma 6, Drizzle ORM, raw SQL + pg driver

**Drizzle** มี bundle size เล็กกว่า และ query syntax ใกล้ SQL กว่า แต่ migration tooling ยัง early-stage กว่า Prisma และ type inference สำหรับ nested include/select ซับซ้อนกว่า

**raw SQL** ให้ control สูงสุด แต่ไม่มี type safety — ทุก query return `any` ต้อง cast เอง

**POS มี schema ที่ซับซ้อน** (5 models หลัก, หลาย relation, onDelete rules ต่างกัน) — Prisma schema เป็น single source of truth ที่อ่านเข้าใจง่ายกว่า raw migration SQL

## Decision

ใช้ **Prisma 6** เป็น ORM หลัก

เหตุผลหลัก:
- Schema เป็น single source of truth — ทีมอ่านเข้าใจ domain model ได้ทันทีจาก `schema.prisma`
- Type inference จาก `Prisma.OrderGetPayload<{ include: ... }>` ทำให้ API response types accurate
- `prisma.$transaction()` รองรับ atomic payment flow (Payment + Receipt + Order + Table ใน transaction เดียว)
- `prisma.config.ts` + `binaryTargets` จัดการ Vercel deployment ได้
- Migration history ชัดเจน — audit trail สำหรับ schema changes

Prisma singleton ไว้ที่ `src/lib/prisma.ts` เดียว — ป้องกัน connection pool exhaustion บน serverless

## Consequences

**ดี:**
- `Prisma.Decimal` จัดการ precision ราคา (฿) ได้ถูกต้อง — ไม่มี floating point error
- Cascade/Restrict/SetNull rules อ่านได้ชัดใน schema — business logic ชัดเจน
- `Prisma.PrismaClientKnownRequestError` ให้ error code (P2002, P2025) สำหรับ error handling ที่ specific

**ข้อควรระวัง:**
- Prisma binary ต้อง include ใน Vercel bundle — ต้องการ `binaryTargets: ["native", "rhel-openssl-3.0.x"]` และ `outputFileTracingIncludes`
- `prisma generate` ต้องรันหลัง `npm install` (ดู `postinstall` script)
- ถ้า switch ไป Drizzle ทีหลัง — ต้อง rewrite service layer ทั้งหมด (high cost)
