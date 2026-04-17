"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={[
        "w-full rounded-2xl bg-white p-0 shadow-xl",
        "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        sizeClasses[size],
      ].join(" ")}
      onClick={(e) => {
        // Close only when clicking the backdrop (outside the dialog box)
        const rect = dialogRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clickedOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
        if (clickedOutside) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cafe-brown-100 px-6 py-4">
        <h2 className="text-base font-semibold text-cafe-brown-900">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="ปิด"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
