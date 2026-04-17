"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CashPaymentForm } from "./CashPaymentForm";
import { PromptPayForm } from "./PromptPayForm";
import { CardPaymentForm } from "./CardPaymentForm";

type PaymentMethod = "cash" | "promptpay" | "card";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  total: number;
};

const METHODS: { id: PaymentMethod; label: string; emoji: string }[] = [
  { id: "cash", label: "เงินสด", emoji: "💵" },
  { id: "promptpay", label: "พร้อมเพย์", emoji: "📱" },
  { id: "card", label: "บัตร", emoji: "💳" },
];

export function PaymentModal({ isOpen, onClose, orderId, total }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");

  function handleSuccess() {
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ชำระเงิน" size="sm">
      {/* Method tabs */}
      <div
        role="tablist"
        aria-label="วิธีชำระเงิน"
        className="mb-5 flex rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1 gap-1"
      >
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={method === m.id}
            aria-controls={`payment-panel-${m.id}`}
            id={`payment-tab-${m.id}`}
            onClick={() => setMethod(m.id)}
            className={[
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              method === m.id
                ? "bg-white shadow-sm text-cafe-brown-900"
                : "text-cafe-brown-500 hover:text-cafe-brown-700",
            ].join(" ")}
          >
            <span className="mr-1.5">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Method panels */}
      <div
        id="payment-panel-cash"
        role="tabpanel"
        aria-labelledby="payment-tab-cash"
        hidden={method !== "cash"}
      >
        <CashPaymentForm orderId={orderId} total={total} onSuccess={handleSuccess} />
      </div>
      <div
        id="payment-panel-promptpay"
        role="tabpanel"
        aria-labelledby="payment-tab-promptpay"
        hidden={method !== "promptpay"}
      >
        <PromptPayForm orderId={orderId} total={total} onSuccess={handleSuccess} />
      </div>
      <div
        id="payment-panel-card"
        role="tabpanel"
        aria-labelledby="payment-tab-card"
        hidden={method !== "card"}
      >
        <CardPaymentForm orderId={orderId} total={total} onSuccess={handleSuccess} />
      </div>
    </Modal>
  );
}
