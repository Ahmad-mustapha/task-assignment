"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Mail, Pencil, Trash2, CheckSquare } from "lucide-react";

import { TaskCard } from "@/components/tasks/TaskCard";
import { AssigneeForm } from "@/components/assignees/AssigneeForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useUIStore } from "@/stores/useUIStore";
import { queryKeys } from "@/lib/query-keys";
import { initials, formatDate } from "@/lib/format";
import { deleteAssigneeAction } from "@/app/(admin)/assignees/actions";
import type { AssigneeWithTaskCount, TaskWithAssignee } from "@/types";

export function AssigneeDetailView({
  assignee,
  tasks,
}: {
  assignee: AssigneeWithTaskCount;
  tasks: TaskWithAssignee[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openAssigneeForm = useUIStore((state) => state.openAssigneeForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openTasks = tasks.filter((task) => task.status !== "COMPLETED").length;
  const completedTasks = tasks.length - openTasks;

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAssigneeAction(assignee.id);

    if (!result.success) {
      setDeleting(false);
      setConfirmOpen(false);
      toast.error(result.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.assignees.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });

    // The action already phrases what happened to their tasks.
    toast.success(result.message);

    router.push("/assignees");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/assignees"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#066433] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to assignees
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-full bg-[#EDF2EC] dark:bg-[#066433]/20 flex items-center justify-center text-lg font-bold text-[#1B4332] dark:text-[#5BBE85] shrink-0">
              {initials(assignee.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {assignee.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
                {assignee.role}
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {assignee.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openAssigneeForm(assignee.id)}
              className="px-4 py-2.5 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-[#066433] hover:text-[#066433] flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete assignee"
              className="px-4 py-2.5 border border-red-50 dark:border-red-900/40 text-sm font-bold text-[#ff3333] bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {tasks.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
              Open
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {openTasks}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
              Completed
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {completedTasks}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-6">
          Added {formatDate(assignee.createdAt)}
        </p>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
          Assigned Tasks
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>

        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks assigned"
            description={`${assignee.name} has no tasks yet.`}
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      <AssigneeForm assignees={[assignee]} />

      <ConfirmDialog
        open={confirmOpen}
        loading={deleting}
        title={`Delete ${assignee.name}?`}
        description={
          openTasks > 0
            ? `Their ${openTasks} open ${
                openTasks === 1 ? "task" : "tasks"
              } will remain and become Unassigned. This cannot be undone.`
            : "This team member will be permanently removed. This cannot be undone."
        }
        confirmLabel="Delete assignee"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
