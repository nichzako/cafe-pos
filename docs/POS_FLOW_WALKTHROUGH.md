# POS Flow Walkthrough

บันทึก walkthrough โค้ดตั้งแต่ Admin / Cashier / Barista รับออเดอร์ → กดจ่ายเงิน → เปลี่ยนสถานะรอดำเนินการ → พร้อมเสิร์ฟ จนข้อมูลถูกบันทึกลงฐานข้อมูล

---

## Step 1 — รับออเดอร์ (POS → บันทึก Order ลง DB)

พนักงานเปิดหน้า `/pos` เพื่อเลือกเมนูใส่ตะกร้า กดโต๊ะ ใส่ส่วนลด แล้วกด "ส่งออเดอร์"

**Frontend (กด "ส่งออเดอร์")**
- `src/app/(dashboard)/pos/page.tsx` — Server Component ดึง `categories`, `menus`, `tables` จาก Prisma แบบ parallel แล้วส่งเป็น props
- `src/app/(dashboard)/pos/_components/POSClient.tsx` → `handleSubmit()` ยิง `POST /api/orders` ด้วย body `{ tableId, items, discount }`
- สถานะตะกร้าใช้ `useReducer(cartReducer)` ร่วมกับ `OrderPanel` + `MenuGrid`

**API Route**
- `src/app/api/orders/route.ts` → `POST`: ผ่าน `requireAuth()` + `requireRole(["admin","cashier"])` → validate ด้วย `createOrderSchema` → เรียก service

**Service Layer + DB (atomic)**
- `src/lib/services/order.service.ts` → `createOrder()`
  1. ตรวจ `Table` ว่าไม่ถูก reserved
  2. **Fetch ราคาเมนูจาก DB เอง** (ไม่เชื่อ client)
  3. คำนวณ `subtotal`/`total` server-side
  4. `generateOrderNumber()` + `prisma.$transaction` สร้าง `Order` + nested `OrderItem` และ `update Table.status → "occupied"` พร้อมกัน
  5. retry 1 รอบถ้า `orderNumber` ชน unique constraint (P2002)
- DB ที่ถูกเขียน: **Order, OrderItem, Table**

เสร็จแล้ว client `router.push(/orders/{id})`

---

## Step 2 — กดจ่ายเงิน / Checkout (Payment + ปิดออเดอร์)

เข้าหน้า `/orders/[id]` จะเห็นสรุปออเดอร์ กด "ชำระเงิน" เปิด modal เลือก Cash / PromptPay / Card (ในที่นี้ยก Cash เป็นตัวอย่าง)

**Frontend**
- `src/app/(dashboard)/orders/[id]/page.tsx` — Server Component fetch order พร้อม items, payment, receipt
- `src/app/(dashboard)/orders/[id]/_components/OrderDetailClient.tsx` — แสดงปุ่ม "ชำระเงิน" เมื่อ `status === "pending"` → เปิด `PaymentModal`
- `src/app/(dashboard)/orders/[id]/_components/PaymentModal.tsx` — tablist สลับ 3 วิธี
- `src/app/(dashboard)/orders/[id]/_components/CashPaymentForm.tsx` → `handleSubmit()` ยิง `POST /api/payment/cash` ด้วย `{ orderId, amountTendered }`

**API Route**
- `src/app/api/payment/cash/route.ts` — auth + role → validate `cashPaymentSchema` → `processCashPayment()`
- (PromptPay → `/api/payment/promptpay`, Card → `/api/payment/card` ต่อ Omise จริง)

**Service Layer + DB (atomic)**
- `src/lib/services/payment.service.ts` → `processCashPayment()`
  1. `fetchOrderForPayment()` — ตรวจว่าออเดอร์ยัง `pending` และยังไม่มี `Payment`
  2. ตรวจเงินที่รับ ≥ ยอดรวม คำนวณ `change`
  3. `commitPayment()` เรียก `prisma.$transaction` บันทึก 4 อย่างพร้อมกัน:
     - สร้าง **Payment** (method="cash", status="paid", gatewayMeta เก็บ `amountTendered` / `change`)
     - สร้าง **Receipt** พร้อม snapshot `ReceiptData`
     - update **Order.status → "completed"**
     - update **Table.status → "available"** (ถ้ามี tableId)
  4. retry ถ้า `receiptNumber` ชน unique
- DB ที่ถูกเขียน: **Payment, Receipt, Order, Table**

เสร็จแล้ว client `router.push(/orders/{id}/receipt)` + `router.refresh()`

---

## Step 3 — รอดำเนินการ → กำลังเตรียม → พร้อมเสิร์ฟ (เปลี่ยนสถานะออเดอร์)

เปิดหน้า `/orders` เห็นรายการ แบ่ง tab ตามสถานะ (barista/cashier เห็นเฉพาะ active) แต่ละการ์ดมีปุ่ม action ขั้นถัดไป

**Frontend**
- `src/app/(dashboard)/orders/page.tsx` — Server Component fetch orders 100 รายการล่าสุด (กรองเฉพาะ active ถ้าไม่ใช่ admin)
- `src/app/(dashboard)/orders/_components/OrderListClient.tsx` — tabs กรอง + `useOrdersRealtime()` subscribe Supabase Realtime auto-refresh
- `src/app/(dashboard)/orders/_components/OrderCard.tsx` — ตาราง `NEXT_ACTION` กำหนดปุ่มตามสถานะ:
  - `pending → preparing` ("เริ่มทำ")
  - `preparing → ready` ("พร้อมเสิร์ฟ")
  - `ready → completed` ("เสร็จสิ้น")
- `changeStatus()` ยิง `PATCH /api/orders/{id}` → `router.refresh()`

**API Route + DB (atomic)**
- `src/app/api/orders/[id]/route.ts` → `PATCH`
  1. `requireAuth()` (ไม่ต้องเช็ค role ยกเว้น cancel)
  2. ตรวจ transition ผ่านตาราง `ALLOWED_TRANSITIONS` — ห้ามข้าม state
  3. ถ้า `cancelled` ต้องเป็น admin หรือ owner
  4. `prisma.$transaction`: update **Order.status** + (ถ้า `completed` / `cancelled` และมีโต๊ะ) update **Table.status → "available"** พร้อมกัน
- DB ที่ถูกเขียน: **Order** (+ **Table** เฉพาะตอนจบออเดอร์)

หลัง update Supabase Realtime จะ push event กลับไปที่ทุก client ที่เปิด `/orders` ให้ refresh auto ผ่าน `useOrdersRealtime`

---

## สรุปโครงสร้างรวม (big picture)

Flow ทั้งหมดใช้ pattern เดียวกันทุก step:

**UI (Client) → API Route (auth + Zod) → Service (business logic + Prisma `$transaction`) → DB**

Business logic อยู่ใน service layer ที่เดียว, API route ทำแค่ auth/validate/delegate และทุก write ที่แตะหลายตารางถูกห่อด้วย `$transaction` เพื่อให้ atomic — ถ้าส่วนใดพัง จะ rollback ทั้งหมด ไม่เหลือสถานะค้าง เช่น Table occupied แต่ Order ไม่ถูกสร้าง

### State Machine ของ Order

```
pending ──► preparing ──► ready ──► completed
   │            │
   └── cancelled ┘
```

### ตารางที่ถูกเขียนในแต่ละ Step

| Step | Tables ที่เขียน |
|---|---|
| 1. รับออเดอร์ | Order, OrderItem, Table (occupied) |
| 2. ชำระเงิน | Payment, Receipt, Order (completed), Table (available) |
| 3. เปลี่ยนสถานะ | Order (+ Table ถ้า completed/cancelled) |
