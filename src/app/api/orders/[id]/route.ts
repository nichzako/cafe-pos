import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { successResponse } from "@/lib/api-response";
import { notFound, badRequest, forbidden } from "@/lib/api-error";
import { updateOrderStatusSchema } from "@/lib/validations/order";

type Context = { params: Promise<Record<string, string>> };

import type { OrderStatus } from "@/generated/prisma/client";

// Valid status transitions — prevents arbitrary status jumps.
// Non-cancel transitions are intentionally open to any authenticated staff:
// barista needs to advance pending→preparing→ready without ownership restriction.
// Only cancellation requires admin or order-owner authorization (enforced below).
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const GET = withHandler(async (req: NextRequest, ctx: Context) => {
  await requireAuth(req);
  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      table: { select: { id: true, name: true, number: true } },
      staff: { select: { id: true, name: true } },
      payment: { select: { id: true, method: true, status: true, amount: true, paidAt: true } },
    },
  });

  if (!order) throw notFound("ไม่พบออเดอร์นี้");
  return successResponse(order);
});

export const PATCH = withHandler(async (req: NextRequest, ctx: Context) => {
  const staff = await requireAuth(req);
  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, staffId: true, tableId: true },
  });
  if (!order) throw notFound("ไม่พบออเดอร์นี้");

  const body = await req.json();
  const { status } = updateOrderStatusSchema.parse(body);

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw badRequest(
      `ไม่สามารถเปลี่ยนสถานะจาก "${order.status}" เป็น "${status}" ได้`
    );
  }

  // Only admin or the staff who created the order can cancel
  if (status === "cancelled") {
    const isOwner = order.staffId === staff.id;
    const isAdmin = staff.role === "admin";
    if (!isOwner && !isAdmin) {
      throw forbidden("ไม่มีสิทธิ์ยกเลิกออเดอร์นี้");
    }
  }

  const shouldFreeTable =
    (status === "completed" || status === "cancelled") && order.tableId;

  // Atomic transaction: order status + table release must succeed or fail together.
  // Using two separate updates would leave the table occupied if the second update fails.
  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status },
      select: { id: true, orderNumber: true, status: true, tableId: true },
    }),
    ...(shouldFreeTable
      ? [
          prisma.table.update({
            where: { id: order.tableId! },
            data: { status: "available" },
          }),
        ]
      : []),
  ]);

  return successResponse(updated);
});
