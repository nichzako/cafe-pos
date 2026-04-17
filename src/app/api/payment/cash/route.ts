import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { createdResponse } from "@/lib/api-response";
import { cashPaymentSchema } from "@/lib/validations/payment";
import { processCashPayment } from "@/lib/services/payment.service";

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, ["admin", "cashier"]);

  const body = await req.json();
  const { orderId, amountTendered } = cashPaymentSchema.parse(body);

  const result = await processCashPayment(orderId, staff.id, amountTendered);
  return createdResponse(result);
});
