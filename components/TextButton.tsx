"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function TextButton({
  children,
  variant = "secondary",
  className = "",
  ...rest
}: TextButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "border-slate-800 bg-slate-800 text-white hover:bg-slate-900"
      : variant === "ghost"
        ? "border-transparent text-slate-700 hover:bg-slate-100"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50";
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
