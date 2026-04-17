import { NextResponse } from "next/server";
import type { ApiResponse, PaginatedApiResponse } from "@/types";

// ─── Success Responses ────────────────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function createdResponse<T>(
  data: T,
  location?: string
): NextResponse<ApiResponse<T>> {
  const headers = location ? { Location: location } : undefined;
  return NextResponse.json({ success: true, data }, { status: 201, headers });
}

export function paginatedResponse<T>(
  items: T[],
  meta: { total: number; page: number; limit: number }
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json({ success: true, data: { items, meta } });
}

// ─── Error Responses ─────────────────────────────────────────────────────────

export function errorResponse(
  message: string,
  status = 500
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message }, { status });
}
