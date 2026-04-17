import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { createdResponse, paginatedResponse } from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validations/order";
import { createOrder } from "@/lib/services/order.service";
import { ACTIVE_ORDER_STATUSES } from "@/lib/order-constants";
import { Prisma } from "@prisma/client";
import { badRequest } from "@/lib/api-error";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 20;

const ORDER_STATUS_SCHEMA = z.enum([
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

// ─── Routes ───────────────────────────────────────────────────────────────────

export const GET = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT))));
  const skip = (page - 1) * limit;

  // Validate status query param before using it
  let status: z.infer<typeof ORDER_STATUS_SCHEMA> | null = null;
  if (rawStatus !== null) {
    const parsed = ORDER_STATUS_SCHEMA.safeParse(rawStatus);
    if (!parsed.success) {
      throw badRequest("สถานะออเดอร์ไม่ถูกต้อง");
    }
    status = parsed.data;
  }

  // cashier/barista ดูได้เฉพาะ active orders, admin ดูทั้งหมด
  const statusFilter: Prisma.OrderWhereInput | undefined =
    status
      ? { status }
      : staff.role !== "admin"
        ? { status: { in: ACTIVE_ORDER_STATUSES } }
        : undefined;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: statusFilter,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        note: true,
        createdAt: true,
        table: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where: statusFilter }),
  ]);

  return paginatedResponse(orders, { total, page, limit });
});

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, ["admin", "cashier"]);

  const body = await req.json();
  const { tableId, items, discount = 0, note } = createOrderSchema.parse(body);

  const order = await createOrder({
    tableId: tableId ?? null,
    staffId: staff.id,
    items,
    discount,
    note,
  });

  return createdResponse(order, `/api/orders/${order.id}`);
});
