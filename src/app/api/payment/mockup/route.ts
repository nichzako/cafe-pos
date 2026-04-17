import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { createdResponse } from "@/lib/api-response";
import { notFound } from "@/lib/api-error";
import { mockupPaymentSchema } from "@/lib/validations/payment";
import { processMockupPayment } from "@/lib/services/payment.service";

export const POST = withHandler(async (req: NextRequest) => {
  // Guard: endpoint นี้ใช้ได้เฉพาะเมื่อ ENABLE_MOCKUP_GATEWAY=true
  // ป้องกันไม่ให้ simulate payment ได้ใน production โดยไม่ตั้งใจ
  if (process.env.ENABLE_MOCKUP_GATEWAY !== "true") {
    throw notFound("endpoint นี้ไม่พร้อมใช้งาน");
  }

  const staff = await requireAuth(req);
  requireRole(staff, ["admin", "cashier"]);

  const body = await req.json();
  const { orderId, simulateSuccess } = mockupPaymentSchema.parse(body);

  const result = await processMockupPayment(orderId, staff.id, simulateSuccess);
  return createdResponse(result);
});
