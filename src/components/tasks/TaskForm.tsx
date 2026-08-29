"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useUIStore } from "@/stores/useUIStore";
import { queryKeys } from "@/lib/query-keys";
import {
  createTaskAction,
  updateTaskAction,
} from "@/app/(admin)/tasks/actions";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type AssigneeWithTaskCount,
  type TaskWithAssignee,
  type Paginated,
} from "@/types";

const fieldClass =
  "w-full px-4 py-3 rounded-[10px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:border-[#066433] focus:ring-2 focus:ring-[#066433]/10 transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-slate-100 text-sm";

const labelClass =
  "block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide";

type FormState = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assigneeId: "",
};

function toFormState(task: TaskWithAssignee): FormState {
  // Handle both string and Date formats for dueDate
  const formatDueDate = (date: string | Date | null): string => {
    try {
      if (!date) return "";
      if (typeof date === "string") {
        return date.slice(0, 10); // Extract YYYY-MM-DD from ISO string
      }
      if (date instanceof Date) {
        return date.toISOString().slice(0, 10); // Convert Date to YYYY-MM-DD
      }
      return "";
    } catch (error) {
      console.warn("Error formatting due date:", error);
      return "";
    }
  };

  try {
    return {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority || "MEDIUM",
      dueDate: formatDueDate(task?.dueDate),
      assigneeId: task?.assigneeId || "",
    };
  } catch (error) {
    console.warn("Error converting task to form state:", error);
    return EMPTY;
  }
}

export function TaskForm({
  assignees,
  task,
}: {
  assignees: AssigneeWithTaskCount[];
  /** Provided by the detail page, which already has the task server-side. */
  task?: TaskWithAssignee;
}) {
  const open = useUIStore((state) => state.taskFormOpen);
  const editingId = useUIStore((state) => state.editingTaskId);

  if (!open) return null;

  try {
    // Keyed so opening a different task remounts with fresh state.
    return (
      <TaskFormDialog
        key={editingId ?? "new"}
        editingId={editingId}
        assignees={assignees || []}
        task={task}
      />
    );
  } catch (error) {
    console.error("TaskForm error:", error);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="relative bg-white dark:bg-slate-900 p-6 rounded-lg max-w-sm">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>Unable to load task form</p>
          </div>
          <button
            onClick={() => useUIStore.getState().closeTaskForm()}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

function TaskFormDialog({
  editingId,
  assignees,
  task,
}: {
  editingId: string | null;
  assignees: AssigneeWithTaskCount[];
  task?: TaskWithAssignee;
}) {
  const close = useUIStore((state) => state.closeTaskForm);
  const queryClient = useQueryClient();

  // The task is already in the Query cache from the list or detail page, so
  // read it synchronously rather than refetching and syncing via an effect.
  // Prefer the task the detail page handed us; otherwise read the one the
  // list already cached. Either way it is available synchronously.
  const existing = !editingId
    ? undefined
    : (() => {
        try {
          return (task ??
            queryClient
              .getQueriesData<Paginated<TaskWithAssignee>>({
                queryKey: queryKeys.tasks.all,
              })
              .flatMap(([, page]) => page?.items ?? [])
              .find((item) => item.id === editingId));
        } catch (error) {
          console.warn("Error finding existing task:", error);
          return undefined;
        }
      })();

  const [form, setForm] = useState<FormState>(() => {
    try {
      return existing ? toFormState(existing) : EMPTY;
    } catch (error) {
      console.warn("Error initializing form state:", error);
      return EMPTY;
    }
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isEditing = Boolean(editingId);

  useEffect(() => {
    try {
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
      };

      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    } catch (error) {
      console.warn("Error setting up keyboard listener:", error);
    }
  }, [close]);

  const update = (key: keyof FormState, value: string) => {
    try {
      setForm((previous) => (previous ? { ...previous, [key]: value } : previous));
      // Clear the field's error as soon as the admin edits it.
      setFieldErrors((previous) => {
        if (!previous[key]) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
      setHasError(false);
    } catch (error) {
      console.warn("Error updating form field:", error);
      setHasError(true);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    try {
      event.preventDefault();
      if (!form) return;

      setSubmitting(true);
      setFieldErrors({});

      const payload = {
        title: form.title || "",
        description: form.description || undefined,
        status: form.status || "TODO",
        priority: form.priority || "MEDIUM",
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      };

      const result = editingId
        ? await updateTaskAction(editingId, payload)
        : await createTaskAction(payload);

      setSubmitting(false);

      if (!result.success) {
        setFieldErrors(result.fields ?? {});
        toast.error(result.error || "Something went wrong");
        return;
      }

      // Server actions revalidate the pages; this refreshes the Query cache
      // that the client-side list and dashboard read from.
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignees.all });

      toast.success(result.message || "Task saved successfully");
      close();
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitting(false);
      setHasError(true);
      toast.error("Failed to save task");
    }
  };

  const errorFor = (key: string) => {
    try {
      return fieldErrors[key]?.[0];
    } catch (error) {
      console.warn("Error getting field error:", error);
      return undefined;
    }
  };

  if (hasError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/60" onClick={close} />
        <div className="relative bg-white dark:bg-slate-900 p-6 rounded-lg max-w-sm">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="w-5 h-5" />
            <p>Something went wrong</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setHasError(false);
                setForm(existing ? toFormState(existing) : EMPTY);
              }}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm"
            >
              Try Again
            </button>
            <button
              onClick={close}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        aria-labelledby="task-form-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-[14px] shadow-xl dark:bg-slate-900"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="task-form-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
          >
            {isEditing ? "Edit Task" : "New Task"}
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
              <label htmlFor="title" className={labelClass}>
                Title
              </label>
              <input
                id="title"
                value={form?.title || ""}
                onChange={(event) => update("title", event.target.value)}
                placeholder="e.g. Redesign the onboarding flow"
                className={fieldClass}
                aria-invalid={Boolean(errorFor("title"))}
              />
              {errorFor("title") && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">
                  {errorFor("title")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={form?.description || ""}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Add more detail (optional)"
                className={`${fieldClass} resize-none`}
                aria-invalid={Boolean(errorFor("description"))}
              />
              {errorFor("description") && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">
                  {errorFor("description")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  value={form?.status || "TODO"}
                  onChange={(event) => update("status", event.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {TASK_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className={labelClass}>
                  Priority
                </label>
                <select
                  id="priority"
                  value={form?.priority || "MEDIUM"}
                  onChange={(event) => update("priority", event.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {TASK_PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className={labelClass}>
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={form?.dueDate || ""}
                  onChange={(event) => update("dueDate", event.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                />
              </div>

              <div>
                <label htmlFor="assignee" className={labelClass}>
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={form?.assigneeId || ""}
                  onChange={(event) => update("assigneeId", event.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">Unassigned</option>
                  {(assignees || []).map((assignee) => (
                    <option key={assignee?.id} value={assignee?.id}>
                      {assignee?.name}
                    </option>
                  ))}
                </select>
              </div>
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
                    : "Create Task"}
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
