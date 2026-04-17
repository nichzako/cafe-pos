import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff } from "@/lib/auth-helpers";
import { ACTIVE_ORDER_STATUSES } from "@/lib/order-constants";
import { OrderListClient } from "./_components/OrderListClient";
import type { UserRole } from "@/types/index";

export const metadata: Metadata = {
  title: "รายการออเดอร์ — Cafe POS",
};

export default async function OrdersPage() {
  const staff = await getAuthenticatedStaff();
  if (!staff) redirect("/login");

  const isAdmin = staff.role === "admin";

  const orders = await prisma.order.findMany({
    where: isAdmin ? undefined : { status: { in: ACTIVE_ORDER_STATUSES } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      table: { select: { id: true, name: true } },
      staff: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });

  // Serialize Decimal → number and Date → ISO string for client components
  const serialized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <OrderListClient
      orders={serialized}
      staffRole={staff.role as UserRole}
      staffId={staff.id}
    />
  );
}
