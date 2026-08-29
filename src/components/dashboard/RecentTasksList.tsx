import Link from "next/link";
import { CheckCircle2, Clock, Circle, MoreHorizontal, ArrowUpRight } from "lucide-react";

import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { timeAgo } from "@/lib/format";
import type { TaskWithAssignee } from "@/types";

function statusIcon(status: TaskWithAssignee["status"]) {
  if (status === "COMPLETED")
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === "IN_PROGRESS")
    return <Clock className="w-4 h-4 text-blue-600" />;
  return <Circle className="w-4 h-4 text-slate-400" />;
}

export function RecentTasksList({ tasks }: { tasks: TaskWithAssignee[] }) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Recent Activity
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
            Latest task updates
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-[11px] font-bold text-[#066433] uppercase tracking-widest hover:text-[#066433]/80 flex items-center gap-1 hover:underline"
        >
          View all
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No recent activity.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-slate-50 dark:border-slate-800 hover:bg-[#FBFBFB] dark:hover:bg-slate-800 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 rounded-[10px]"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 rounded-full">
                  {statusIcon(task.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate tracking-tight">
                    {task.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-bold uppercase tracking-wider">
                    {task.assignee?.name ?? "Unassigned"} •{" "}
                    {timeAgo(task.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                <TaskPriorityBadge priority={task.priority} />
                <Link
                  href={`/tasks/${task.id}`}
                  aria-label={`View ${task.title}`}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
