# ADR-005: Omise เป็น Payment Gateway

**Status:** Accepted  
**Date:** 2026-01-15 (บันทึกย้อนหลัง)

## Context

ระบบ POS ต้องการรับชำระเงิน 3 ช่องทาง: บัตรเครดิต/เดบิต, PromptPay QR, และเงินสด  
ตัวเลือก payment gateway สำหรับตลาดไทย: **Omise**, **2C2P**, **Stripe**, **KBank PGW**, **SCB Easy API**

**Stripe ออก** เพราะไม่รองรับ PromptPay โดยตรง และเหมาะกับตลาด global มากกว่า ไทย

**KBank PGW / SCB Easy API** ผูกกับธนาคารเดียว — ถ้าร้านค้าต้องการเปลี่ยนธนาคาร ต้อง migrate gateway ทั้งหมด

**2C2P** รองรับ PromptPay และบัตร แต่ onboarding ซับซ้อนกว่า และ SDK documentation น้อยกว่า Omise

ทุก gateway ยกเว้น Omise ต้องการ merchant account ที่ผ่าน underwriting จากธนาคาร — Omise onboarding เร็วกว่าสำหรับ SME

## Decision

ใช้ **Omise** เป็น payment gateway สำหรับบัตรเครดิต/เดบิต

PromptPay QR ทำเองผ่าน `promptpay-qr` library (generate QR code จาก PromptPay ID) — ไม่ผ่าน gateway เพราะเป็น standard ของธนาคารไทยที่ไม่ต้องการ intermediary สำหรับ QR display-only flow

เหตุผลหลัก:
- PCI compliance: Omise.js tokenize card data ใน browser ก่อนส่ง server — `OMISE_SECRET_KEY` ไม่เคย touch card data โดยตรง
- Node.js SDK ที่มีทั้ง callback และ Promise wrapper
- `charge.id` เป็น audit trail ที่ track ย้อนหลังได้ใน Omise dashboard
- Test mode ที่ใช้งานได้จริง — `ENABLE_MOCKUP_GATEWAY` สำหรับ dev/test environment ที่ไม่ต้องการ live credential

## Consequences

**ดี:**
- PCI scope ลดลง — card data ไม่ผ่าน server
- `gatewayMeta` เก็บ `charge.id`, `card_brand`, `card_last_digits` ใน Payment record → audit trail
- Mockup gateway (`/api/payment/mockup`) ช่วย E2E test โดยไม่ต้อง live credential

**ข้อควรระวัง:**
- Omise SDK 1.1.x เป็น callback-based — ต้อง wrap ด้วย Promise (ดู `omise-client.ts`)
- SDK 1.1.x ไม่รองรับ `Idempotency-Key` HTTP header ผ่าน params — ต้อง upgrade SDK ถ้าต้องการ server-level charge idempotency (ดู tech debt ใน payment.service.ts)
- ถ้า Omise ล้มเหลว (network error) — charge อาจสำเร็จฝั่ง Omise แต่ commit ล้มเหลว → order ค้างสถานะ pending — ต้องมี reconciliation process สำหรับ production scale
