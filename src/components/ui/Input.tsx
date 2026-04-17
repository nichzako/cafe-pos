import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-cafe-brown-800"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "rounded-xl border px-3 py-2 text-sm text-cafe-brown-900 placeholder-cafe-brown-400",
            "bg-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-cafe-brown-500 focus:border-transparent",
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-cafe-brown-200 hover:border-cafe-brown-300",
            "disabled:bg-cafe-brown-50 disabled:cursor-not-allowed disabled:text-cafe-brown-400",
            className,
          ].join(" ")}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-cafe-brown-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
