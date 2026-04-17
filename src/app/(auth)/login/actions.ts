"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

type FormState = { error: string } | null;

export async function signInAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return { error: message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // ใช้ error.code ซึ่งเป็น stable identifier แทน error.message ที่อาจเปลี่ยนได้
    switch (error.code) {
      case "invalid_credentials":
        return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      case "email_not_confirmed":
        return { error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" };
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return { error: "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" };
      default:
        return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
    }
  }

  redirect("/pos");
}
