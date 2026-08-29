"use client";

import { Search, X } from "lucide-react";

import { TASK_STATUSES, TASK_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import type { AssigneeWithTaskCount } from "@/types";

type TaskFiltersProps = {
  search: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  sort: string;
  order: string;
  assignees: AssigneeWithTaskCount[];
  onSearch: (value: string) => void;
  onStatus: (value?: string) => void;
  onPriority: (value?: string) => void;
  onAssignee: (value?: string) => void;
  onSort: (sort: string, order: string) => void;
  onReset: () => void;
};

/**
 * Field and direction travel together as one value, so the admin picks a
 * meaningful order ("Due soonest") rather than composing two dropdowns.
 */
const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "dueDate:asc", label: "Due soonest" },
  { value: "dueDate:desc", label: "Due latest" },
  { value: "priority:desc", label: "Priority: high to low" },
  { value: "priority:asc", label: "Priority: low to high" },
];

const selectClass =
  "px-4 py-2.5 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-[#066433] focus:outline-none focus:ring-2 focus:ring-[#066433]/10 rounded-[10px] transition-all cursor-pointer shadow-sm";

export function TaskFilters({
  search,
  status,
  priority,
  assigneeId,
  sort,
  order,
  assignees,
  onSearch,
  onStatus,
  onPriority,
  onAssignee,
  onSort,
  onReset,
}: TaskFiltersProps) {
  // Sorting is not a filter, so it does not light up the Clear button.
  const hasFilters = Boolean(search || status || priority || assigneeId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-4 rounded-[10px] shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search tasks by title or description..."
            aria-label="Search tasks"
            className="w-full pl-11 pr-4 py-2.5 bg-[#FBFBFB] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[10px] text-sm outline-none focus:border-[#066433] transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status ?? ""}
            onChange={(event) => onStatus(event.target.value || undefined)}
            aria-label="Filter by status"
            className={selectClass}
          >
            <option value="">All statuses</option>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>

          <select
            value={priority ?? ""}
            onChange={(event) => onPriority(event.target.value || undefined)}
            aria-label="Filter by priority"
            className={selectClass}
          >
            <option value="">All priorities</option>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>

          <select
            value={assigneeId ?? ""}
            onChange={(event) => onAssignee(event.target.value || undefined)}
            aria-label="Filter by assignee"
            className={selectClass}
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>

          <select
            value={`${sort}:${order}`}
            onChange={(event) => {
              const [nextSort, nextOrder] = event.target.value.split(":");
              onSort(nextSort, nextOrder);
            }}
            aria-label="Sort tasks"
            className={selectClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={onReset}
              className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-[#066433] flex items-center gap-1.5 rounded-[10px] transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
