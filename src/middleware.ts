import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Session Refresh + Route Protection
 *
 * ทำ 2 อย่างทุก request:
 * 1. Refresh Supabase session token (สำคัญมาก — ห้ามลบหรือย้าย code ส่วนนี้)
 * 2. Redirect ถ้า route ไม่ตรงกับ auth state
 *
 * SAFETY: ห้ามแก้ไขไฟล์นี้โดยไม่ได้รับอนุมัติ (ดู CLAUDE.md)
 */

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  // ต้อง create response ก่อน เพื่อให้ setAll cookies ทำงานได้
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Step 1: set บน request (สำหรับ downstream)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: create response ใหม่พร้อม request ที่อัพเดต
          supabaseResponse = NextResponse.next({ request });
          // Step 3: set บน response (ส่งกลับ browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ ห้าม run code ระหว่าง createServerClient กับ getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Authenticated user at root → redirect ไปหน้า POS หลัก
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/pos";
    return NextResponse.redirect(url);
  }

  // Authenticated user at login page → redirect ไปหน้า POS
  if (user && isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/pos";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user at protected route
  if (!user && !isPublicPath(pathname)) {
    // API routes → คืน 401 JSON (ไม่ใช่ redirect เพราะ fetch client ต้องการ status code)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }
    // หน้าเว็บ → redirect ไป login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
