import type { Metadata } from "next";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ — Cafe POS",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-cafe-brown-200 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cafe-brown-100">
            <span className="text-2xl" role="img" aria-label="cafe">
              ☕
            </span>
          </div>
          <h1 className="text-xl font-semibold text-cafe-brown-900">
            Cafe POS
          </h1>
          <p className="mt-1 text-sm text-cafe-brown-500">
            เข้าสู่ระบบด้วยบัญชีพนักงาน
          </p>
        </div>

        {/* Form */}
        <LoginForm />
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-cafe-brown-400">
        มีปัญหาเข้าสู่ระบบ? ติดต่อผู้ดูแลร้าน
      </p>
    </div>
  );
}
