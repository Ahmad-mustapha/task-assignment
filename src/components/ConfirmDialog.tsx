"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={onCancel}
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[14px] shadow-xl p-6"
      >
        <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-[#ff3333]" />
        </div>

        <h2
          id="confirm-title"
          className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
        >
          {title}
        </h2>
        <p
          id="confirm-description"
          className="text-sm text-slate-500 mt-2 font-medium leading-relaxed"
        >
          {description}
        </p>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-[#ff3333] hover:bg-[#ff3333]/90 disabled:opacity-60 text-white text-sm font-bold rounded-[10px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-3 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
