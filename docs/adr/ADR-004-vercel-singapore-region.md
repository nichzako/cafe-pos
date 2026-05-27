# ADR-004: Deploy บน Vercel ที่ Singapore Region

**Status:** Accepted  
**Date:** 2026-01-20 (บันทึกย้อนหลัง จาก commit `340e187`)

## Context

โปรเจค POS ใช้ Supabase ที่ตั้งอยู่ที่ **AWS ap-southeast-1 (Singapore)** ทุก API route ทำ DB query อย่างน้อย 1 ครั้ง ดังนั้น latency ระหว่าง compute และ database มีผล direct ต่อ response time

ตัวเลือก deploy:
- **Vercel default region (US)** — compute ห่าง DB ~180ms round-trip per query
- **Vercel Singapore (sin1)** — compute อยู่ใกล้ Supabase Singapore ~5ms
- **Vercel Edge Runtime** — global distribution แต่ไม่รองรับ Prisma (binary engine)
- **Self-hosted (Docker + VPS Singapore)** — latency ต่ำสุด แต่ต้องดูแล infra เอง

**POS ทำงาน real-time** — cashier รอ response ระหว่าง order submission, payment processing — latency สูงกระทบ UX โดยตรง

**Edge Runtime ออก** เพราะ Prisma engine เป็น binary — ไม่รันบน Edge ได้

## Decision

Deploy **Vercel Node.js runtime ที่ Singapore region (sin1)**

เหตุผลหลัก:
- Network latency DB → compute ลดจาก ~180ms เหลือ ~5ms — critical สำหรับ payment flow ที่มีหลาย queries
- Vercel managed → zero infra ops, auto-scaling, built-in CDN สำหรับ static assets
- Node.js runtime รองรับ Prisma binary และ `serverExternalPackages` config

config ใน `vercel.json` (ถ้ามี) หรือ dashboard: set region to `sin1`

## Consequences

**ดี:**
- API response time ลดลงอย่างมีนัยสำคัญสำหรับ query-heavy routes (orders, payment)
- Supabase Realtime WebSocket connection ก็ latency ต่ำด้วย (same region)

**ข้อควรระวัง:**
- ถ้าย้าย Supabase instance ไป region อื่น → ต้อง redeploy Vercel ไป region นั้นด้วย
- Prisma binary ต้อง `binaryTargets: ["native", "rhel-openssl-3.0.x"]` เพื่อรันบน Vercel Linux
- Cold start บน Vercel serverless มีผลถ้า traffic น้อย — Prisma connection ต้อง warm up ใหม่
