"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { useChangeTaskStatus } from "@/hooks/useTasks";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/types";

/**
 * Inline status switcher on a list row. Uses the optimistic mutation so the
 * badge flips before the request lands, rolling back if the server refuses.
 */
export function TaskStatusMenu({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const changeStatus = useChangeTaskStatus();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change status, currently ${STATUS_LABELS[status]}`}
        className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#066433]/40"
      >
        <TaskStatusBadge status={status} />
        {changeStatus.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40">
        {TASK_STATUSES.map((value) => (
          <DropdownMenuItem
            key={value}
            disabled={value === status}
            onSelect={() => changeStatus.mutate({ id: taskId, status: value })}
            className="text-sm font-medium"
          >
            <span className="flex-1">{STATUS_LABELS[value]}</span>
            {value === status && (
              <Check className="w-3.5 h-3.5 text-[#066433]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
