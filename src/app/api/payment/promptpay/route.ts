import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { withHandler } from "@/lib/route-handler";
import { createdResponse } from "@/lib/api-response";
import { promptpayPaymentSchema } from "@/lib/validations/payment";
import { processPromptPayPayment } from "@/lib/services/payment.service";

export const POST = withHandler(async (req: NextRequest) => {
  const staff = await requireAuth(req);
  requireRole(staff, ["admin", "cashier"]);

  const body = await req.json();
  const { orderId } = promptpayPaymentSchema.parse(body);

  const result = await processPromptPayPayment(orderId, staff.id);
  return createdResponse(result);
});
