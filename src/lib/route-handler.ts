import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-error";
import { errorResponse } from "@/lib/api-response";
import type { ApiResponse } from "@/types";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<ApiResponse<unknown>>>;

/**
 * withHandler — wraps an API route with standardized error handling.
 *
 * Catches:
 *  - ZodError      → 400 with first validation message (Thai)
 *  - ApiError      → HTTP status from error + Thai message
 *  - Unknown error → 500 with generic Thai message (detail logged server-side)
 *
 * @example
 * export const GET = withHandler(async (req) => {
 *   const menus = await prisma.menu.findMany();
 *   return successResponse(menus);
 * });
 */
export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        return errorResponse(message, 400);
      }

      if (err instanceof ApiError) {
        return errorResponse(err.message, err.statusCode);
      }

      // Malformed JSON body — return 400 with Thai message instead of 500
      if (err instanceof SyntaxError) {
        return errorResponse("ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบ request body", 400);
      }

      // Unexpected error — log details server-side, return generic message to client
      process.stderr.write(`[API Error] ${String(err)}\n`);
      return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
    }
  };
}
