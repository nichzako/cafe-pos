import { prisma } from "@/lib/prisma";
import { notFound, badRequest } from "@/lib/api-error";
import { generateOrderNumber } from "@/lib/order-number";
import { Prisma } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_NUMBER_MAX_RETRIES = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateOrderInput = {
  tableId: string | null;
  staffId: string;
  items: Array<{ menuId: string; quantity: number; note?: string }>;
  discount: number;
  note?: string;
};

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Creates an order atomically:
 * 1. Validates table availability
 * 2. Fetches server-side menu prices (never trusts client)
 * 3. Calculates totals
 * 4. Creates Order + OrderItems + updates Table status in one transaction
 *
 * Retries once on orderNumber collision (count-then-construct is non-atomic).
 */
export async function createOrder(input: CreateOrderInput) {
  const { tableId, staffId, items, discount, note } = input;

  // Step 1: Validate table
  if (tableId) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    debugger; // [BP10] ดู: table.status — "available"/"occupied"/"reserved", null = ไม่มีโต๊ะนี้
    if (!table) throw notFound("ไม่พบโต๊ะที่เลือก");
    if (table.status === "reserved") throw badRequest("โต๊ะนี้ถูกจองแล้ว");
  }

  // Step 2: Fetch menu prices server-side — never trust client-sent prices
  const menuIds = items.map((item) => item.menuId);
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, isAvailable: true },
    select: { id: true, name: true, price: true },
  });
  debugger; // [BP11] ดู: menuIds.length vs menus.length — ถ้าไม่เท่ากัน = บางเมนู unavailable

  if (menus.length !== menuIds.length) {
    throw badRequest("บางเมนูไม่พร้อมให้บริการ กรุณาตรวจสอบรายการอีกครั้ง");
  }

  // Step 3: Calculate totals server-side
  const menuMap = new Map(menus.map((m) => [m.id, m]));
  debugger; // [BP12] ดู: menuMap — ขยาย Map ใน Variables panel เช็คราคาแต่ละเมนู
  const orderItems = items.map((item) => {
    const menu = menuMap.get(item.menuId)!;
    return {
      menuId: item.menuId,
      menuName: menu.name,
      menuPrice: menu.price,
      quantity: item.quantity,
      note: item.note ?? null,
      lineTotal: new Prisma.Decimal(Number(menu.price) * item.quantity),
    };
  });
  debugger; // [BP13] ดู: orderItems — แต่ละ item มี lineTotal = menuPrice × quantity ถูกมั้ย

  const subtotal = orderItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
  const total = Math.max(0, subtotal - discount);
  debugger; // [BP14] ดู: subtotal, discount, total — total ต้อง ≥ 0 เสมอ

  // Step 4: Create order + update table in a single transaction
  // Retry once on order number collision (generateOrderNumber is non-atomic)
  for (let attempt = 0; attempt < ORDER_NUMBER_MAX_RETRIES; attempt++) {
    const orderNumber = await generateOrderNumber();
    debugger; // [BP15] ดู: orderNumber (format เช่น "ORD-001"), attempt (0 = ครั้งแรก)

    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber,
            tableId: tableId ?? null,
            staffId,
            note: note ?? null,
            subtotal: new Prisma.Decimal(subtotal),
            discount: new Prisma.Decimal(discount),
            total: new Prisma.Decimal(total),
            items: { create: orderItems },
          },
          include: {
            items: true,
            table: { select: { id: true, name: true } },
            staff: { select: { id: true, name: true } },
          },
        });

        if (tableId) {
          await tx.table.update({
            where: { id: tableId },
            data: { status: "occupied" },
          });
        }

        return created;
      });

      return order;
    } catch (err) {
      // P2002 = unique constraint violation on orderNumber — retry once
      if (
        attempt < ORDER_NUMBER_MAX_RETRIES - 1 &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }

  throw badRequest("ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
}
