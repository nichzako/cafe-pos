/**
 * ApiError — structured error for API routes.
 *
 * Throw an ApiError in any API route handler. The route-handler wrapper
 * catches it and returns the correct HTTP status + Thai error message via ApiResponse.
 *
 * @example
 * throw new ApiError("ไม่พบเมนูนี้", 404);
 * throw new ApiError("ไม่มีสิทธิ์เข้าถึง", 403, "FORBIDDEN");
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── HTTP Status Helpers ──────────────────────────────────────────────────────

export function badRequest(message = "ข้อมูลไม่ถูกต้อง"): ApiError {
  return new ApiError(message, 400, "BAD_REQUEST");
}

export function unauthorized(message = "กรุณาเข้าสู่ระบบก่อน"): ApiError {
  return new ApiError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "ไม่มีสิทธิ์เข้าถึง"): ApiError {
  return new ApiError(message, 403, "FORBIDDEN");
}

export function notFound(message = "ไม่พบข้อมูล"): ApiError {
  return new ApiError(message, 404, "NOT_FOUND");
}

export function conflict(message = "ข้อมูลซ้ำกัน"): ApiError {
  return new ApiError(message, 409, "CONFLICT");
}

export function unprocessable(message: string): ApiError {
  return new ApiError(message, 422, "UNPROCESSABLE");
}

export function serverError(message = "เกิดข้อผิดพลาดภายในระบบ"): ApiError {
  return new ApiError(message, 500, "INTERNAL_ERROR");
}
