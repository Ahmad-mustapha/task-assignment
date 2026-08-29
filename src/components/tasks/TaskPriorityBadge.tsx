import { PRIORITY_LABELS, type TaskPriority } from "@/types";

// Priority uses warmth to signal urgency, deliberately distinct from the
// status palette so the two are never confused at a glance.
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700",
  MEDIUM:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50",
  HIGH: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50",
};

const PRIORITY_DOTS: Record<TaskPriority, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 font-bold uppercase tracking-widest rounded-full border ${PRIORITY_STYLES[priority]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[priority]}`}
        aria-hidden
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
