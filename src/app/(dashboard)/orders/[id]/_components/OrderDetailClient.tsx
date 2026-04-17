"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, OrderStatusBadge } from "@/components/ui/Badge";
import { PaymentModal } from "./PaymentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string;
  menuName: string;
  menuPrice: number;
  quantity: number;
  lineTotal: number;
  note: string | null;
};

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: number;
  gatewayMeta: unknown;
  paidAt: Date | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  note: string | null;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: Date;
  table: { id: string; name: string } | null;
  staff: { id: string; name: string };
  items: OrderItem[];
  payment: Payment | null;
  receipt: { id: string; receiptNumber: string } | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderDetailClient({ order }: { order: Order }) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const isPending = order.status === "pending";
  const isCompleted = order.status === "completed";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/pos"
          aria-label="กลับหน้ารับออเดอร์"
          className="rounded-xl p-2 text-cafe-brown-500 hover:bg-cafe-brown-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-cafe-brown-900">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge
              status={order.status as Parameters<typeof OrderStatusBadge>[0]["status"]}
              size="md"
            />
          </div>
          <p className="text-sm text-cafe-brown-500">
            {order.table ? order.table.name : "Takeaway"} •{" "}
            {order.staff.name} •{" "}
            {new Date(order.createdAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        {isCompleted && order.receipt && (
          <Link href={`/orders/${order.id}/receipt`}>
            <Button variant="secondary" size="sm">
              <Printer className="h-4 w-4" />
              ใบเสร็จ
            </Button>
          </Link>
        )}
      </div>

      {/* Items */}
      <section className="rounded-2xl border border-cafe-brown-100 bg-white overflow-hidden">
        <div className="border-b border-cafe-brown-100 px-4 py-3">
          <h2 className="font-semibold text-cafe-brown-900">รายการ</h2>
        </div>
        <ul className="divide-y divide-cafe-brown-50">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="shrink-0 rounded-lg bg-cafe-brown-100 px-2 py-0.5 text-sm font-medium text-cafe-brown-700">
                ×{item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-cafe-brown-900 text-sm">
                  {item.menuName}
                </p>
                {item.note && (
                  <p className="text-xs text-cafe-brown-400 mt-0.5">
                    หมายเหตุ: {item.note}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm text-cafe-brown-700">
                ฿{item.lineTotal.toLocaleString("th-TH")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      <section className="rounded-2xl border border-cafe-brown-100 bg-white px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm text-cafe-brown-600">
          <span>ราคารวม</span>
          <span>฿{order.subtotal.toLocaleString("th-TH")}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>ส่วนลด</span>
            <span>−฿{order.discount.toLocaleString("th-TH")}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-cafe-brown-100 pt-2 text-base font-bold text-cafe-brown-900">
          <span>ยอดรวม</span>
          <span>฿{order.total.toLocaleString("th-TH")}</span>
        </div>
      </section>

      {/* Payment info (if paid) */}
      {order.payment && (
        <PaymentInfo payment={order.payment} />
      )}

      {/* Note */}
      {order.note && (
        <section className="rounded-2xl border border-cafe-brown-100 bg-white px-4 py-3">
          <p className="text-xs text-cafe-brown-500 mb-1">หมายเหตุ</p>
          <p className="text-sm text-cafe-brown-800">{order.note}</p>
        </section>
      )}

      {/* Actions */}
      {isPending && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setIsPaymentOpen(true)}
          aria-label="เปิดหน้าต่างชำระเงิน"
        >
          <CreditCard className="h-5 w-5" />
          ชำระเงิน ฿{order.total.toLocaleString("th-TH")}
        </Button>
      )}

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        orderId={order.id}
        total={order.total}
      />
    </div>
  );
}

// ─── PaymentInfo sub-component ────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  card: "บัตร",
  mockup: "ทดสอบ",
};

function PaymentInfo({ payment }: { payment: Payment }) {
  const meta = payment.gatewayMeta as Record<string, unknown> | null;
  const change = meta?.change as number | undefined;

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-emerald-800">ชำระเงินแล้ว</span>
        <Badge variant="success" size="md">
          {METHOD_LABELS[payment.method] ?? payment.method}
        </Badge>
      </div>
      <div className="flex justify-between text-sm text-emerald-700">
        <span>จำนวนที่ชำระ</span>
        <span>฿{payment.amount.toLocaleString("th-TH")}</span>
      </div>
      {change !== undefined && change > 0 && (
        <div className="flex justify-between text-sm font-medium text-emerald-800">
          <span>เงินทอน</span>
          <span>฿{change.toLocaleString("th-TH")}</span>
        </div>
      )}
      {payment.paidAt && (
        <p className="text-xs text-emerald-600">
          {new Date(payment.paidAt).toLocaleString("th-TH", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </section>
  );
}
