/**
 * Cron Job: Daily Sales Report
 *
 * ทำงานทุกคืนเที่ยงคืน (00:00 Bangkok time ≈ 17:00 UTC)
 * ตาม vercel.json: schedule "0 17 * * *"
 *
 * Security: ตรวจสอบ Authorization header ที่มี CRON_SECRET
 * Vercel ส่ง header "Authorization: Bearer <CRON_SECRET>" โดยอัตโนมัติ
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailyReport } from "@/lib/services/email.service";
import type { DailyReportData } from "@/emails/DailyReportEmail";

export const runtime = "nodejs"; // ต้องการ Prisma — ไม่สามารถใช้ Edge runtime

export async function GET(req: NextRequest) {
  // ── Security: ตรวจสอบ CRON_SECRET ────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── กำหนดช่วงเวลา: เมื่อวาน 00:00 – 23:59:59 (Bangkok time) ──────────────
  // ใช้เวลา UTC ตรง: Thailand = UTC+7
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  todayStart.setUTCDate(todayStart.getUTCDate() - 7); // ชดเชย UTC+7

  // เมื่อวาน
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setUTCMilliseconds(-1);

  // ── Query orders ──────────────────────────────────────────────────────────
  const [orders, topItems] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        status: { in: ["completed", "cancelled"] },
      },
      include: {
        payment: {
          select: { method: true, amount: true, status: true },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["menuName"],
      where: {
        order: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: "completed",
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // ── คำนวณสรุป ─────────────────────────────────────────────────────────────
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  // Payment breakdown — นับเฉพาะ paid payments
  const paymentMap = new Map<string, { count: number; amount: number }>();
  for (const order of completedOrders) {
    if (order.payment?.status === "paid") {
      const method = order.payment.method;
      const existing = paymentMap.get(method) ?? { count: 0, amount: 0 };
      paymentMap.set(method, {
        count: existing.count + 1,
        amount: existing.amount + Number(order.payment.amount),
      });
    }
  }

  const paymentBreakdown = Array.from(paymentMap.entries()).map(
    ([method, data]) => ({ method, ...data })
  );

  // Top items
  const topItemsList = topItems.map((item) => ({
    name: item.menuName,
    qty: item._sum.quantity ?? 0,
    revenue: Number(item._sum.lineTotal ?? 0),
  }));

  // Format date (Thai Buddhist era)
  const reportDate = yesterdayStart.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });

  const shopName = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafe POS";

  const report: DailyReportData = {
    date: reportDate,
    shopName,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    totalRevenue,
    paymentBreakdown,
    topItems: topItemsList,
  };

  // ── ส่ง email ─────────────────────────────────────────────────────────────
  const emailResult = await sendDailyReport(report);

  return NextResponse.json({
    success: true,
    report: {
      date: reportDate,
      totalOrders: report.totalOrders,
      completedOrders: report.completedOrders,
      totalRevenue: report.totalRevenue,
    },
    email: emailResult,
  });
}
