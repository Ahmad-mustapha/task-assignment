import { STATUS_LABELS, type TaskStatus } from "@/types";

// Status uses hue to separate states at a glance: grey = not started,
// blue = active, green = done.
const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700",
  IN_PROGRESS:
    "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50",
  COMPLETED:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`text-[10px] px-3 py-1 font-bold uppercase tracking-widest rounded-full border ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
