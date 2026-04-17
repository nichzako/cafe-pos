import { prisma } from "@/lib/prisma";
import { badRequest, notFound, conflict } from "@/lib/api-error";
import { generateReceiptNumber } from "@/lib/order-number";
import { createOmiseClient, toSatang } from "@/lib/omise-client";
import { Prisma, PaymentMethod as PrismaPaymentMethod } from "@/generated/prisma/client";
import type { ReceiptData } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECEIPT_NUMBER_MAX_RETRIES = 2;
const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME ?? "Cafe POS";

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Derive the type directly from the query shape — eliminates the need for double cast.
const ORDER_FOR_PAYMENT_INCLUDE = {
  items: {
    select: {
      menuName: true,
      menuPrice: true,
      quantity: true,
      lineTotal: true,
      note: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  table: { select: { name: true } },
  staff: { select: { name: true } },
  payment: { select: { id: true } },
} satisfies Prisma.OrderInclude;

type OrderForPayment = NonNullable<
  Prisma.OrderGetPayload<{ include: typeof ORDER_FOR_PAYMENT_INCLUDE }>
>;

async function fetchOrderForPayment(orderId: string): Promise<OrderForPayment> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_FOR_PAYMENT_INCLUDE,
  });

  if (!order) throw notFound("ไม่พบออเดอร์นี้");
  if (order.status !== "pending")
    throw badRequest("ออเดอร์นี้ไม่อยู่ในสถานะรอชำระเงิน");
  if (order.payment) throw conflict("ออเดอร์นี้ชำระเงินไปแล้ว");

  return order;
}

function buildReceiptData(
  order: OrderForPayment,
  receiptNumber: string,
  method: string,
  paidAt: Date
): ReceiptData {
  return {
    receiptNumber,
    orderNumber: order.orderNumber,
    tableName: order.table?.name ?? null,
    staffName: order.staff.name,
    items: order.items.map((i) => ({
      name: i.menuName,
      qty: i.quantity,
      unitPrice: Number(i.menuPrice),
      lineTotal: Number(i.lineTotal),
      note: i.note ?? undefined,
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    paymentMethod: method as ReceiptData["paymentMethod"],
    paidAt: paidAt.toISOString(),
    shopName: SHOP_NAME,
  };
}

/**
 * Runs the payment transaction atomically:
 * Payment + Receipt + Order.completed + Table.available
 */
async function commitPayment(
  order: OrderForPayment,
  staffId: string,
  method: string,
  amount: number,
  gatewayMeta: Prisma.InputJsonValue
): Promise<{ receiptId: string; receiptNumber: string }> {
  for (let attempt = 0; attempt < RECEIPT_NUMBER_MAX_RETRIES; attempt++) {
    const receiptNumber = await generateReceiptNumber();
    const paidAt = new Date();
    const receiptData = buildReceiptData(order, receiptNumber, method, paidAt);

    try {
      const { receipt } = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            staffId,
            method: method as PrismaPaymentMethod,
            status: "paid",
            amount: new Prisma.Decimal(amount),
            gatewayMeta,
            paidAt,
          },
        });

        const receipt = await tx.receipt.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            receiptNumber,
            data: receiptData as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: "completed" },
        });

        if (order.tableId) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: "available" },
          });
        }

        return { payment, receipt };
      });

      return { receiptId: receipt.id, receiptNumber };
    } catch (err) {
      // P2002 = unique constraint on receiptNumber — retry once
      if (
        attempt < RECEIPT_NUMBER_MAX_RETRIES - 1 &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }

  throw badRequest("ไม่สามารถสร้างใบเสร็จได้ กรุณาลองใหม่อีกครั้ง");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type CashPaymentResult = {
  receiptId: string;
  receiptNumber: string;
  change: number;
};

export async function processCashPayment(
  orderId: string,
  staffId: string,
  amountTendered: number
): Promise<CashPaymentResult> {
  const order = await fetchOrderForPayment(orderId);
  const total = Number(order.total);

  if (amountTendered < total) {
    throw badRequest(
      `จำนวนเงินไม่เพียงพอ ยอดที่ต้องชำระ ฿${total.toLocaleString("th-TH")}`
    );
  }

  const change = Math.round((amountTendered - total) * 100) / 100;
  const result = await commitPayment(order, staffId, "cash", total, {
    amountTendered,
    change,
  });

  return { ...result, change };
}

export type PromptPayPaymentResult = {
  receiptId: string;
  receiptNumber: string;
};

export async function processPromptPayPayment(
  orderId: string,
  staffId: string
): Promise<PromptPayPaymentResult> {
  const order = await fetchOrderForPayment(orderId);
  const total = Number(order.total);

  return commitPayment(order, staffId, "promptpay", total, {
    method: "promptpay_mockup",
  });
}

export type MockupPaymentResult = {
  receiptId: string | null;
  receiptNumber: string | null;
  success: boolean;
};

export async function processMockupPayment(
  orderId: string,
  staffId: string,
  simulateSuccess: boolean
): Promise<MockupPaymentResult> {
  const order = await fetchOrderForPayment(orderId);
  const total = Number(order.total);

  if (!simulateSuccess) {
    await prisma.payment.create({
      data: {
        orderId,
        staffId,
        method: "mockup",
        status: "failed",
        amount: new Prisma.Decimal(total),
        gatewayMeta: { simulated: false },
      },
    });
    return { receiptId: null, receiptNumber: null, success: false };
  }

  const result = await commitPayment(order, staffId, "mockup", total, {
    simulated: true,
  });
  return { ...result, success: true };
}

export type CardPaymentResult = {
  receiptId: string;
  receiptNumber: string;
  chargeId: string;
};

export async function processCardPayment(
  orderId: string,
  staffId: string,
  omiseToken: string
): Promise<CardPaymentResult> {
  const order = await fetchOrderForPayment(orderId);
  const total = Number(order.total);

  const omise = createOmiseClient();
  const amountInSatang = toSatang(total);

  let charge;
  try {
    charge = await omise.charges.create({
      amount: amountInSatang,
      currency: "thb",
      card: omiseToken,
      description: `Order ${order.orderNumber} — ${SHOP_NAME}`,
    });
  } catch (err) {
    // Omise network/API error — record failed payment for audit trail
    await prisma.payment.create({
      data: {
        orderId,
        staffId,
        method: "card",
        status: "failed",
        amount: new Prisma.Decimal(total),
        gatewayMeta: { error: String(err) },
      },
    });
    throw badRequest("เชื่อมต่อ Omise ไม่สำเร็จ กรุณาลองใหม่หรือใช้วิธีอื่น");
  }

  if (!charge.paid) {
    // Charge declined — record failure so admin can audit
    await prisma.payment.create({
      data: {
        orderId,
        staffId,
        method: "card",
        status: "failed",
        amount: new Prisma.Decimal(total),
        gatewayRef: charge.id,
        gatewayMeta: {
          failure_code: charge.failure_code,
          failure_message: charge.failure_message,
          card_brand: charge.card?.brand ?? null,
          card_last_digits: charge.card?.last_digits ?? null,
        },
      },
    });
    throw badRequest(
      `บัตรถูกปฏิเสธ: ${charge.failure_message ?? "กรุณาตรวจสอบข้อมูลบัตรหรือติดต่อธนาคาร"}`
    );
  }

  const result = await commitPayment(order, staffId, "card", total, {
    chargeId: charge.id,
    card_brand: charge.card?.brand ?? null,
    card_last_digits: charge.card?.last_digits ?? null,
  });

  return { ...result, chargeId: charge.id };
}
