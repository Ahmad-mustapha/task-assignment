import Link from "next/link";
import { CalendarDays, MoreHorizontal, AlertCircle } from "lucide-react";

import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskStatusMenu } from "@/components/tasks/TaskStatusMenu";
import { formatDate, isOverdue, initials } from "@/lib/format";
import type { TaskWithAssignee } from "@/types";

/** One row in the task list. Kept as a card so it reflows on mobile. */
export function TaskCard({ task }: { task: TaskWithAssignee }) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-4 md:p-5 rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#EDF2EC] dark:bg-[#066433]/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-[#1B4332] dark:text-[#5BBE85]">
            {task.assignee ? initials(task.assignee.name) : "—"}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/tasks/${task.id}`}
              className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight hover:text-[#066433] dark:hover:text-[#5BBE85] transition-colors line-clamp-1"
            >
              {task.title}
            </Link>
            {task.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {task.assignee?.name ?? "Unassigned"}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  overdue ? "text-rose-600" : "text-slate-400"
                }`}
              >
                {overdue ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <CalendarDays className="w-3 h-3" />
                )}
                {formatDate(task.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pl-14 lg:pl-0">
          <div className="flex items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusMenu taskId={task.id} status={task.status} />
          </div>
          <Link
            href={`/tasks/${task.id}`}
            aria-label={`View ${task.title}`}
            className="p-2 hover:bg-[#FBFBFB] dark:hover:bg-slate-800 text-slate-300 hover:text-slate-600 rounded-full transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
