"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

import { useUIStore } from "@/stores/useUIStore";
import { queryKeys } from "@/lib/query-keys";
import {
  createAssigneeAction,
  updateAssigneeAction,
} from "@/app/(admin)/assignees/actions";
import type { AssigneeWithTaskCount } from "@/types";

const fieldClass =
  "w-full px-4 py-3 rounded-[10px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:border-[#066433] focus:ring-2 focus:ring-[#066433]/10 transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-slate-100 text-sm";

const labelClass =
  "block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide";

type FormState = { name: string; email: string; role: string };

const EMPTY: FormState = { name: "", email: "", role: "" };

export function AssigneeForm({
  assignees,
}: {
  assignees: AssigneeWithTaskCount[];
}) {
  const open = useUIStore((state) => state.assigneeFormOpen);
  const editingId = useUIStore((state) => state.editingAssigneeId);

  if (!open) return null;

  // Keyed so switching between assignees remounts with fresh state.
  return (
    <AssigneeFormDialog
      key={editingId ?? "new"}
      editingId={editingId}
      assignees={assignees}
    />
  );
}

function AssigneeFormDialog({
  editingId,
  assignees,
}: {
  editingId: string | null;
  assignees: AssigneeWithTaskCount[];
}) {
  const close = useUIStore((state) => state.closeAssigneeForm);
  const router = useRouter();
  const queryClient = useQueryClient();

  const existing = editingId
    ? assignees.find((item) => item.id === editingId)
    : undefined;

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? { name: existing.name, email: existing.email, role: existing.role }
      : EMPTY
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const update = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    setFieldErrors({});

    const result = editingId
      ? await updateAssigneeAction(editingId, form)
      : await createAssigneeAction(form);

    setSubmitting(false);

    if (!result.success) {
      // Duplicate email arrives here as a field error, not just a toast.
      setFieldErrors(result.fields ?? {});
      toast.error(result.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.assignees.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

    toast.success(result.message);
    close();
    router.refresh();
  };

  const errorFor = (key: string) => fieldErrors[key]?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={close}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignee-form-title"
        className="relative bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-[14px] shadow-xl dark:bg-slate-900"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="assignee-form-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
          >
            {isEditing ? "Edit Assignee" : "New Assignee"}
          </h2>
          <button
            onClick={close}
            aria-label="Close"
            className="p-1.5 rounded-[10px] border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name
            </label>
            <input
              id="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Sarah Chen"
              className={fieldClass}
              aria-invalid={Boolean(errorFor("name"))}
            />
            {errorFor("name") && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                {errorFor("name")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="e.g. sarah.chen@example.com"
              className={fieldClass}
              aria-invalid={Boolean(errorFor("email"))}
            />
            {errorFor("email") && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                {errorFor("email")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className={labelClass}>
              Role / Job Title
            </label>
            <input
              id="role"
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              placeholder="e.g. Product Designer"
              className={fieldClass}
              aria-invalid={Boolean(errorFor("role"))}
            />
            {errorFor("role") && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                {errorFor("role")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#066433] hover:bg-[#066433]/90 disabled:bg-[#85b598] text-white text-sm font-bold rounded-[10px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Assignee"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="px-5 py-3 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
