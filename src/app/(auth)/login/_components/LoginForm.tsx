"use client";

import { useActionState } from "react";
import { signInAction } from "../actions";

type FormState = { error: string } | null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    signInAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-cafe-brown-800">
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="staff@cafename.com"
          disabled={isPending}
          className="rounded-lg border border-cafe-brown-300 bg-white px-3 py-2.5 text-sm text-cafe-brown-900 placeholder:text-cafe-brown-400 focus:border-cafe-brown-500 focus:outline-none focus:ring-2 focus:ring-cafe-brown-500/20 disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-cafe-brown-800">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isPending}
          className="rounded-lg border border-cafe-brown-300 bg-white px-3 py-2.5 text-sm text-cafe-brown-900 placeholder:text-cafe-brown-400 focus:border-cafe-brown-500 focus:outline-none focus:ring-2 focus:ring-cafe-brown-500/20 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-2 rounded-lg bg-cafe-brown-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cafe-brown-800 focus:outline-none focus:ring-2 focus:ring-cafe-brown-700/30 active:bg-cafe-brown-900 disabled:opacity-60"
      >
        {isPending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
