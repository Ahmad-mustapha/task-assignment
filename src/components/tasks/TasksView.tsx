"use client";

import React from "react";
import {
  Plus,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeleton";
import { useTasks, usePrefetchNextPage } from "@/hooks/useTasks";
import { useAssignees } from "@/hooks/useAssignees";
import { useDebounced } from "@/hooks/useDebounced";
import { useTaskFilterStore } from "@/stores/useTaskFilterStore";
import { useUIStore } from "@/stores/useUIStore";
import type {
  Paginated,
  TaskWithAssignee,
  AssigneeWithTaskCount,
  TaskStatus,
  TaskPriority,
} from "@/types";

export function TasksView({
  initialTasks,
  assignees: initialAssignees,
}: {
  initialTasks: Paginated<TaskWithAssignee>;
  assignees: AssigneeWithTaskCount[];
}) {
  const filters = useTaskFilterStore();
  const openTaskForm = useUIStore((state) => state.openTaskForm);

  // Debounced so typing does not fire a request per keystroke.
  const debouncedSearch = useDebounced(filters.search);

  const query = {
    status: filters.status,
    priority: filters.priority,
    assigneeId: filters.assigneeId,
    search: debouncedSearch || undefined,
    page: filters.page,
    pageSize: initialTasks.pageSize,
    sort: filters.sort,
    order: filters.order,
  };

  const isDefaultView =
    !filters.status &&
    !filters.priority &&
    !filters.assigneeId &&
    !debouncedSearch &&
    filters.page === 1 &&
    filters.sort === "createdAt" &&
    filters.order === "desc";

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useTasks(query, isDefaultView ? initialTasks : undefined);

  const { data: assignees = initialAssignees } =
    useAssignees(initialAssignees);

  // Warms page N+1 so the next click renders from cache.
  usePrefetchNextPage(query, data?.page ?? 1, data?.totalPages ?? 1);

  const tasks = data?.items ?? [];
  const hasFilters = Boolean(
    filters.status || filters.priority || filters.assigneeId || filters.search
  );

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {data ? `${data.total} ${data.total === 1 ? "task" : "tasks"}` : "—"}
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs text-slate-400">Updating…</span>
            )}
          </p>
        </div>

        <button
          onClick={() => openTaskForm()}
          className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold flex items-center justify-center gap-2 rounded-[10px] transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <TaskFilters
        search={filters.search}
        status={filters.status}
        priority={filters.priority}
        assigneeId={filters.assigneeId}
        sort={filters.sort}
        order={filters.order}
        assignees={assignees}
        onSearch={filters.setSearch}
        onStatus={(value) => filters.setStatus(value as TaskStatus | undefined)}
        onPriority={(value) =>
          filters.setPriority(value as TaskPriority | undefined)
        }
        onAssignee={filters.setAssignee}
        onSort={(sort, order) =>
          filters.setSort(
            sort as "createdAt" | "dueDate" | "priority",
            order as "asc" | "desc"
          )
        }
        onReset={filters.reset}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load tasks"
          description={
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again."
          }
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold inline-flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
            >
              Retry
            </button>
          }
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            hasFilters
              ? "No tasks match the current filters. Try clearing them."
              : "Create your first task to get started."
          }
          action={
            hasFilters ? (
              <button
                onClick={filters.reset}
                className="px-4 py-2.5 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold inline-flex items-center gap-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => openTaskForm()}
                className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold inline-flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-[10px] shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">
                  Page {data.page} of {data.totalPages}
                </p>
                <button
                  onClick={() => filters.setPage(Math.max(1, data.page - 1))}
                  disabled={data.page === 1}
                  className="p-2 border border-slate-100 dark:border-slate-700 rounded-[10px] text-slate-500 hover:border-[#066433] hover:text-[#066433] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    filters.setPage(Math.min(data.totalPages, data.page + 1))
                  }
                  disabled={data.page === data.totalPages}
                  className="p-2 border border-slate-100 dark:border-slate-700 rounded-[10px] text-slate-500 hover:border-[#066433] hover:text-[#066433] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TaskForm assignees={assignees} />
    </div>
  );
}
