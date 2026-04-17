import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./_components/OrderDetailClient";

export const metadata: Metadata = {
  title: "รายละเอียดออเดอร์ — Cafe POS",
};

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      table: { select: { id: true, name: true } },
      staff: { select: { id: true, name: true } },
      payment: {
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          gatewayMeta: true,
          paidAt: true,
        },
      },
      receipt: { select: { id: true, receiptNumber: true } },
    },
  });

  if (!order) notFound();

  // Serialize Decimal → number for client components
  const serialized = {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      menuPrice: Number(item.menuPrice),
      lineTotal: Number(item.lineTotal),
    })),
    payment: order.payment
      ? {
          ...order.payment,
          amount: Number(order.payment.amount),
        }
      : null,
  };

  return <OrderDetailClient order={serialized} />;
}
