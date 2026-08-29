"use client";

import Link from "next/link";
import { Mail, Pencil, Trash2, ArrowUpRight } from "lucide-react";

import { initials } from "@/lib/format";
import type { AssigneeWithTaskCount } from "@/types";

export function AssigneeCard({
  assignee,
  onEdit,
  onDelete,
}: {
  assignee: AssigneeWithTaskCount;
  onEdit: (id: string) => void;
  onDelete: (assignee: AssigneeWithTaskCount) => void;
}) {
  const taskCount = assignee._count.tasks;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-[#EDF2EC] dark:bg-[#066433]/20 flex items-center justify-center text-sm font-bold text-[#1B4332] dark:text-[#5BBE85]">
          {initials(assignee.name)}
        </div>
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </span>
      </div>

      <Link
        href={`/assignees/${assignee.id}`}
        className="font-bold text-slate-900 dark:text-slate-100 tracking-tight hover:text-[#066433] transition-colors truncate"
      >
        {assignee.name}
      </Link>
      <p className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider truncate">
        {assignee.role}
      </p>

      <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-1.5 truncate">
        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{assignee.email}</span>
      </p>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-50 dark:border-slate-800">
        <Link
          href={`/assignees/${assignee.id}`}
          className="flex-1 py-2.5 px-3 border border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:border-[#066433] hover:text-[#066433] transition-all flex items-center justify-center gap-1.5 rounded-[10px] bg-white dark:bg-slate-900"
        >
          View
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => onEdit(assignee.id)}
          aria-label={`Edit ${assignee.name}`}
          className="p-2.5 border border-slate-100 dark:border-slate-700 text-slate-400 hover:border-[#066433] hover:text-[#066433] rounded-[10px] transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(assignee)}
          aria-label={`Delete ${assignee.name}`}
          className="p-2.5 border border-red-50 dark:border-red-900/40 text-[#ff3333] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[10px] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
