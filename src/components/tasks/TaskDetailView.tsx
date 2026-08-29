"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Pencil,
  Trash2,
  AlertCircle,
  User,
  Loader2,
} from "lucide-react";

import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useUIStore } from "@/stores/useUIStore";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, timeAgo, isOverdue, initials } from "@/lib/format";
import {
  changeTaskStatusAction,
  deleteTaskAction,
} from "@/app/(admin)/tasks/actions";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type TaskWithAssignee,
  type AssigneeWithTaskCount,
  type TaskStatus,
} from "@/types";

export function TaskDetailView({
  task,
  assignees,
}: {
  task: TaskWithAssignee;
  assignees: AssigneeWithTaskCount[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openTaskForm = useUIStore((state) => state.openTaskForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();

  const overdue = isOverdue(task.dueDate, task.status);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.assignees.all });
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === task.status) return;

    setPendingStatus(status);
    const result = await changeTaskStatusAction(task.id, { status });
    setPendingStatus(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    invalidate();
    toast.success(result.message);
    // The server action revalidated this route; refresh pulls the new render.
    startTransition(() => router.refresh());
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTaskAction(task.id);

    if (!result.success) {
      setDeleting(false);
      setConfirmOpen(false);
      toast.error(result.error);
      return;
    }

    invalidate();
    toast.success(result.message);
    router.push("/tasks");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#066433] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tasks
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {overdue && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-3 py-1 font-bold uppercase tracking-widest rounded-full border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {task.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openTaskForm(task.id)}
                className="px-4 py-2.5 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-[#066433] hover:text-[#066433] flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                aria-label="Delete task"
                className="px-4 py-2.5 border border-red-50 dark:border-red-900/40 text-sm font-bold text-[#ff3333] bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">
              Description
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
              {task.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">
                Assignee
              </h2>
              {task.assignee ? (
                <Link
                  href={`/assignees/${task.assignee.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#EDF2EC] dark:bg-[#066433]/20 flex items-center justify-center text-[11px] font-bold text-[#1B4332] dark:text-[#5BBE85]">
                    {initials(task.assignee.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#066433] dark:group-hover:text-[#5BBE85] transition-colors truncate">
                      {task.assignee.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {task.assignee.role}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    Unassigned
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">
                Due Date
              </h2>
              <p
                className={`text-sm font-bold flex items-center gap-2 ${
                  overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                {formatDate(task.dueDate)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">
              Change Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((value) => {
                const isCurrent = task.status === value;
                const isPending = pendingStatus === value;

                return (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value)}
                    disabled={isCurrent || pendingStatus !== null}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-[10px] border transition-all flex items-center gap-2 disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-[#EDF2EC] text-[#1B4332] dark:text-[#5BBE85] border-[#066433]/20"
                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-[#066433] hover:text-[#066433] disabled:opacity-50"
                    }`}
                  >
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    {STATUS_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pt-4">
              <Clock className="w-3 h-3" />
              Created {formatDate(task.createdAt)}
            </p>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 sm:pt-4">
              Updated {timeAgo(task.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <TaskForm assignees={assignees} task={task} />

      <ConfirmDialog
        open={confirmOpen}
        loading={deleting}
        title="Delete this task?"
        description={`"${task.title}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete task"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
