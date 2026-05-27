# Flow Diagrams — Cafe POS

Mermaid flowcharts สะท้อน logic จริงในโค้ด — อ้างอิงจาก [order.service.ts](../src/lib/services/order.service.ts) และ [payment.service.ts](../src/lib/services/payment.service.ts)

---

## 1. Create Order Flow

```mermaid
flowchart TD
    A[POST /api/orders] --> B{Auth + Role<br/>admin/cashier?}
    B -->|No| Z1[401/403 Thai error]
    B -->|Yes| C[Zod: createOrderSchema.parse]
    C -->|Invalid| Z2[400 Thai error]
    C -->|Valid| D{tableId ระบุมา?}

    D -->|Yes| E[findUnique table]
    E --> E1{พบโต๊ะ?}
    E1 -->|No| Z3[404 ไม่พบโต๊ะที่เลือก]
    E1 -->|Yes| E2{status = reserved?}
    E2 -->|Yes| Z4[400 โต๊ะนี้ถูกจองแล้ว]
    E2 -->|No| F

    D -->|No takeaway| F[Fetch menus server-side<br/>where isAvailable=true]
    F --> G{menus.length = items.length?}
    G -->|No| Z5[400 บางเมนูไม่พร้อมให้บริการ]
    G -->|Yes| H[คำนวณ lineTotal / subtotal<br/>total = max 0, subtotal - discount]

    H --> I[generateOrderNumber]
    I --> J[prisma.$transaction]
    J --> J1[create Order + OrderItems]
    J1 --> J2{มี tableId?}
    J2 -->|Yes| J3[update Table → occupied]
    J2 -->|No| K
    J3 --> K[Commit tx]

    K --> L{P2002 collision?}
    L -->|Yes attempt 1| I
    L -->|Yes attempt 2| Z6[400 สร้างออเดอร์ไม่ได้]
    L -->|No| M[201 Created + order]
```

---

## 2. Payment Flow (รวม 4 channels: cash / promptpay / card / mockup)

```mermaid
flowchart TD
    A[POST /api/payment/*] --> B{Auth + Role<br/>admin/cashier?}
    B -->|No| Z1[401/403]
    B -->|Yes| C[Zod validate body]
    C --> D[fetchOrderForPayment]

    D --> D1{พบ order?}
    D1 -->|No| Z2[404 ไม่พบออเดอร์]
    D1 -->|Yes| D2{status = pending?}
    D2 -->|No| Z3[400 ไม่อยู่ในสถานะรอชำระ]
    D2 -->|Yes| D3{มี payment แล้ว?}
    D3 -->|Yes| Z4[409 ชำระไปแล้ว]
    D3 -->|No| E{Method?}

    E -->|cash| F1{amountTendered >= total?}
    F1 -->|No| Z5[400 เงินไม่พอ]
    F1 -->|Yes| F2[change = tendered - total]
    F2 --> G

    E -->|promptpay| G[commitPayment]

    E -->|card| H1[omise.charges.create]
    H1 -->|network error| H2[บันทึก Payment status=failed] --> Z6[400 เชื่อมต่อ Omise ไม่สำเร็จ]
    H1 -->|success| H3{charge.paid?}
    H3 -->|No| H4[บันทึก Payment failed<br/>+ gatewayRef, failure_code] --> Z7[400 บัตรถูกปฏิเสธ]
    H3 -->|Yes| G

    E -->|mockup| I1{simulateSuccess?}
    I1 -->|No| I2[บันทึก Payment failed] --> Z8[success=false]
    I1 -->|Yes| G

    G[commitPayment — tx] --> G1[generateReceiptNumber]
    G1 --> G2[create Payment status=paid]
    G2 --> G3[create Receipt snapshot JSON]
    G3 --> G4[Order → completed]
    G4 --> G5{มี tableId?}
    G5 -->|Yes| G6[Table → available]
    G5 -->|No| G7
    G6 --> G7[Commit tx]

    G7 --> P2{P2002 receiptNumber?}
    P2 -->|Yes attempt 1| G1
    P2 -->|Yes attempt 2| Z9[400 สร้างใบเสร็จไม่ได้]
    P2 -->|No| R[201 Created<br/>receiptId + receiptNumber + change/chargeId]
```

---

## 3. Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: createOrder
    pending --> preparing: barista รับงาน
    preparing --> ready: ทำเสร็จ
    ready --> completed: ชำระเงินสำเร็จ<br/>(commitPayment)
    pending --> completed: ชำระทันที takeaway
    pending --> cancelled: admin ยกเลิก
    preparing --> cancelled: admin ยกเลิก
    completed --> [*]
    cancelled --> [*]

    note right of completed
      Table → available
      Receipt ถูกสร้าง
    end note
```

---

## Design Notes

- **Server-side price fetching** — กัน price tampering จาก client
- **Transaction atomicity** — `Order + OrderItems + Table` และ `Payment + Receipt + Order + Table` อยู่ใน tx เดียว
- **Retry on P2002** — unique collision ของ `orderNumber` / `receiptNumber` retry 1 ครั้ง
- **Failed payment persistence** — card flow บันทึก failed record ทุกเคส (network / declined) เพื่อ audit trail
