"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] shadow-sm py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-[#ff3333]" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 mt-1 font-medium max-w-sm mx-auto">
        This page could not be loaded. It may be a temporary connection issue.
      </p>
      <button
        onClick={reset}
        className="mt-6 px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold rounded-[10px] transition-all shadow-sm"
      >
        Try again
      </button>
    </div>
  );
}
