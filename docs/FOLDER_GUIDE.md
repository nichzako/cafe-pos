# Cafe POS — Folder Structure สำหรับคนเริ่มต้น

> อ่านจากมุมมองของ admin หรือ barista ที่ใช้ระบบจริง
> อัปเดตล่าสุด: 2026-04-18

---

## หน้าที่ 1 คนเห็นก่อนอื่น — หน้า Login

```
src/app/(auth)/login/
  ├── page.tsx           ← หน้า login ที่เห็น
  ├── actions.ts         ← ตรวจ email/password กับ Supabase
  └── _components/
      └── LoginForm.tsx  ← ฟอร์มกรอก email + password
```

`(auth)` คือ folder group — แปลว่าหน้าในนี้ **ไม่ต้องล็อกอินก่อน** ระบบจะไม่บล็อก

---

## เมื่อล็อกอินแล้ว — โลกของ `(dashboard)`

ทุกหน้าที่พนักงานใช้งานจริงอยู่ใน `src/app/(dashboard)/` ทั้งหมด ระบบจะตรวจก่อนเสมอว่ามี session อยู่หรือเปล่า ถ้าไม่มีจะ redirect กลับ login ทันที

```
src/app/(dashboard)/
  ├── pos/       ← หน้ารับออเดอร์ (หน้าหลักของแคชเชียร์)
  ├── orders/    ← ประวัติและสถานะออเดอร์ทั้งหมด
  ├── menu/      ← จัดการเมนู (admin เพิ่ม/แก้/ลบ)
  ├── tables/    ← สถานะโต๊ะในร้าน
  └── staff/     ← จัดการพนักงาน (admin เท่านั้น)
```

---

## POS — หน้าหลักที่แคชเชียร์ใช้ทุกวัน

```
src/app/(dashboard)/pos/
  ├── page.tsx                    ← โหลดข้อมูลเมนูจาก DB มาแสดง
  └── _components/
      ├── POSClient.tsx           ← ตัวหน้าจอหลัก (ซ้าย + ขวา)
      ├── CategoryTabs.tsx        ← แท็บ "กาแฟ / ชา / เบเกอรี่ ..."
      ├── MenuGrid.tsx            ← กริดรายการเมนูทางขวา
      ├── OrderPanel.tsx          ← รายการในตะกร้าทางซ้าย
      ├── CartItemRow.tsx         ← แต่ละรายการในตะกร้า (ปรับจำนวน/โน้ต)
      └── cartReducer.ts          ← logic ของตะกร้า (เพิ่ม/ลด/ลบรายการ)
```

สิ่งที่แคชเชียร์ทำ → เลือกเมนู → ตะกร้าอัปเดตใน `cartReducer.ts` → กด "ส่งออเดอร์" → ข้อมูลไปที่ API

---

## Orders — ติดตามออเดอร์และรับเงิน

```
src/app/(dashboard)/orders/
  ├── page.tsx                         ← รายการออเดอร์ทั้งหมด (live อัปเดต)
  ├── _components/
  │   ├── OrderListClient.tsx          ← แสดงลิสต์ออเดอร์
  │   ├── OrderCard.tsx                ← การ์ดแต่ละออเดอร์
  │   └── RealtimeBadge.tsx           ← แสดงสถานะ live (ไม่ต้อง refresh)
  └── [id]/                            ← รายละเอียดออเดอร์แต่ละตัว
      ├── page.tsx                     ← หน้ารายละเอียด
      ├── _components/
      │   ├── OrderDetailClient.tsx    ← แสดงรายการและสถานะ
      │   ├── PaymentModal.tsx         ← popup เลือกวิธีชำระเงิน
      │   ├── CashPaymentForm.tsx      ← ชำระด้วยเงินสด
      │   ├── CardPaymentForm.tsx      ← ชำระด้วยบัตร (Omise)
      │   └── PromptPayForm.tsx        ← ชำระด้วย PromptPay
      └── receipt/
          ├── page.tsx                 ← หน้าใบเสร็จ
          └── _components/
              └── PrintButton.tsx      ← ปุ่มพิมพ์ใบเสร็จ
```

`[id]` ในชื่อ folder หมายถึง dynamic route — เช่น `/orders/abc123` จะโหลดออเดอร์หมายเลข abc123 โดยเฉพาะ

---

## Menu — admin จัดการเมนู

```
src/app/(dashboard)/menu/
  ├── page.tsx                    ← แสดงเมนูทั้งหมด
  ├── loading.tsx                 ← skeleton ขณะโหลด
  ├── error.tsx                   ← หน้า error ถ้าดึงข้อมูลไม่ได้
  └── _components/
      ├── MenuListClient.tsx      ← กริดเมนู + ปุ่มเพิ่ม/แก้/ลบ
      ├── MenuCard.tsx            ← การ์ดแต่ละเมนู
      └── MenuFormModal.tsx       ← form เพิ่ม/แก้ไขเมนู
```

ทุก folder ใน dashboard จะมี `loading.tsx` และ `error.tsx` กำกับ — ระบบจะแสดง skeleton อัตโนมัติขณะรอข้อมูล และแสดง error message ภาษาไทยถ้าเกิดปัญหา

---

## Tables + Staff — จัดการโต๊ะและพนักงาน

```
src/app/(dashboard)/tables/
  └── _components/TableListClient.tsx  ← แผนผังโต๊ะ + สถานะว่าง/ไม่ว่าง

src/app/(dashboard)/staff/
  └── _components/
      ├── StaffListClient.tsx          ← รายชื่อพนักงาน
      └── StaffCard.tsx                ← การ์ดแต่ละคน (ชื่อ, role, สถานะ)
```

---

## เบื้องหลัง — สิ่งที่ user ไม่เห็นแต่ระบบทำงานอยู่ตลอด

```
src/app/api/                    ← "คลังข้อมูล" ที่หน้าบ้านคุยด้วย
  ├── orders/                   ← บันทึก/ดึงออเดอร์
  ├── menus/                    ← บันทึก/ดึงเมนู
  ├── payment/
  │   ├── cash/                 ← จัดการชำระเงินสด
  │   ├── card/                 ← ส่งข้อมูลไป Omise
  │   └── promptpay/            ← จัดการ PromptPay
  ├── tables/                   ← อัปเดตสถานะโต๊ะ
  ├── staff/                    ← จัดการข้อมูลพนักงาน
  └── cron/daily-report/        ← ส่งรายงานยอดขายประจำวัน (อัตโนมัติ)

src/lib/services/               ← "ห้องทำงาน" ที่ logic ซับซ้อนเกิดขึ้น
  ├── order.service.ts          ← สร้างออเดอร์ คำนวณยอด
  ├── payment.service.ts        ← ตัดเงิน + ออกใบเสร็จ + ปลดล็อกโต๊ะ
  └── email.service.ts          ← ส่ง email ใบเสร็จ/รายงาน

src/emails/                     ← template email ที่ส่งให้ลูกค้าหรือ admin
  ├── ReceiptEmail.tsx          ← หน้าตาใบเสร็จที่ส่งทาง email
  └── DailyReportEmail.tsx      ← รายงานยอดขายประจำวัน
```

---

## ส่วนประกอบกลาง — ใช้ร่วมกันทั้งระบบ

```
src/components/ui/              ← "กล่องเครื่องมือ" design system
  ├── Button.tsx                ← ปุ่มทุกปุ่มในระบบ
  ├── Input.tsx                 ← ช่องกรอกข้อมูล
  ├── Modal.tsx                 ← popup ทุก popup
  ├── Badge.tsx                 ← badge สถานะ (pending/completed/...)
  ├── Skeleton.tsx              ← animation โหลดข้อมูล
  └── EmptyState.tsx            ← หน้าว่าง + คำแนะนำ

src/lib/validations/            ← "กฎ" ตรวจข้อมูลก่อนบันทึก
  ├── order.ts                  ← ออเดอร์ต้องมีอะไรบ้าง
  ├── payment.ts                ← ชำระเงินต้องระบุอะไร
  ├── menu.ts                   ← เมนูต้องมีชื่อ ราคา หมวดหมู่
  └── staff.ts                  ← พนักงานต้องมี role ที่ถูกต้อง
```

---

## สรุป — feature ↔ folder

| สิ่งที่พนักงานทำ | folder ที่เกี่ยวข้อง |
|---|---|
| ล็อกอินเข้าระบบ | `(auth)/login/` |
| รับออเดอร์จากลูกค้า | `(dashboard)/pos/` |
| ดูและติดตามออเดอร์ | `(dashboard)/orders/` |
| รับชำระเงิน + พิมพ์ใบเสร็จ | `(dashboard)/orders/[id]/` |
| เพิ่ม/แก้ไขเมนู | `(dashboard)/menu/` |
| ดูสถานะโต๊ะ | `(dashboard)/tables/` |
| จัดการพนักงาน | `(dashboard)/staff/` |
| รับรายงานยอดขายทาง email | `api/cron/` + `emails/` |
