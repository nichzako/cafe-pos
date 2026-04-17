"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-sm text-cafe-brown-500 hover:text-cafe-brown-700 transition-colors print:hidden"
      aria-label="พิมพ์ใบเสร็จ"
    >
      <Printer className="h-4 w-4" />
      พิมพ์
    </button>
  );
}
