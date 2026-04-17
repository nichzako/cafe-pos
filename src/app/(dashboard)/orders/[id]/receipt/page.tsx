import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./_components/PrintButton";
import { Badge } from "@/components/ui/Badge";
import type { ReceiptData } from "@/types";

export const metadata: Metadata = {
  title: "ใบเสร็จ — Cafe POS",
};

type Props = { params: Promise<{ id: string }> };

const METHOD_LABELS: Record<string, string> = {
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  card: "บัตรเครดิต",
  mockup: "ทดสอบ",
};

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { orderId: id },
  });

  if (!receipt) notFound();

  const data = receipt.data as unknown as ReceiptData;

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4 md:p-6">
      {/* Nav actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/orders/${id}`}
          className="flex items-center gap-1.5 text-sm text-cafe-brown-500 hover:text-cafe-brown-700 transition-colors"
          aria-label="กลับรายละเอียดออเดอร์"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
        <PrintButton />
      </div>

      {/* Receipt card */}
      <div className="rounded-2xl border border-cafe-brown-200 bg-white overflow-hidden shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-cafe-brown-700 px-6 py-5 text-center text-white">
          <p className="text-lg font-bold">{data.shopName}</p>
          <p className="mt-0.5 text-sm text-cafe-brown-200">ใบเสร็จรับเงิน</p>
        </div>

        {/* Meta */}
        <div className="border-b border-dashed border-cafe-brown-200 px-6 py-4 space-y-1 text-sm">
          <MetaRow label="เลขใบเสร็จ" value={data.receiptNumber} bold />
          <MetaRow label="ออเดอร์" value={data.orderNumber} />
          <MetaRow label="โต๊ะ" value={data.tableName ?? "Takeaway"} />
          <MetaRow label="พนักงาน" value={data.staffName} />
          <MetaRow
            label="วันเวลา"
            value={new Date(data.paidAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-cafe-brown-500">วิธีชำระ</span>
            <Badge variant="success" size="md">
              {METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-cafe-brown-200 px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cafe-brown-400 border-b border-cafe-brown-100">
                <th className="pb-2 text-left font-medium">รายการ</th>
                <th className="pb-2 text-center font-medium w-8">จำนวน</th>
                <th className="pb-2 text-right font-medium">ราคา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-brown-50">
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pr-2">
                    <p className="font-medium text-cafe-brown-900">{item.name}</p>
                    {item.note && (
                      <p className="text-xs text-cafe-brown-400">{item.note}</p>
                    )}
                  </td>
                  <td className="py-2 text-center text-cafe-brown-600">
                    {item.qty}
                  </td>
                  <td className="py-2 text-right text-cafe-brown-700">
                    ฿{item.lineTotal.toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-cafe-brown-600">
            <span>ราคารวม</span>
            <span>฿{data.subtotal.toLocaleString("th-TH")}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>ส่วนลด</span>
              <span>−฿{data.discount.toLocaleString("th-TH")}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-cafe-brown-200 pt-2 text-base font-bold text-cafe-brown-900">
            <span>ยอดรวม</span>
            <span>฿{data.total.toLocaleString("th-TH")}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-cafe-brown-200 px-6 py-4 text-center">
          <p className="text-sm text-cafe-brown-500">ขอบคุณที่ใช้บริการ</p>
          <p className="mt-0.5 text-xs text-cafe-brown-300">{data.shopName}</p>
        </div>
      </div>

      {/* New order button */}
      <Link
        href="/pos"
        className="flex items-center justify-center gap-2 rounded-xl border border-cafe-brown-200 bg-white px-4 py-3 text-sm font-medium text-cafe-brown-700 hover:bg-cafe-brown-50 transition-colors print:hidden"
        aria-label="กลับหน้ารับออเดอร์ใหม่"
      >
        <ShoppingCart className="h-4 w-4" />
        รับออเดอร์ใหม่
      </Link>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-cafe-brown-500">{label}</span>
      <span className={bold ? "font-semibold text-cafe-brown-900" : "text-cafe-brown-700"}>
        {value}
      </span>
    </div>
  );
}
