"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, Search, AlertCircle } from "lucide-react";

import { AssigneeCard } from "@/components/assignees/AssigneeCard";
import { AssigneeForm } from "@/components/assignees/AssigneeForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { CardGridSkeleton } from "@/components/Skeleton";
import { useAssignees } from "@/hooks/useAssignees";
import { useUIStore } from "@/stores/useUIStore";
import { queryKeys } from "@/lib/query-keys";
import { deleteAssigneeAction } from "@/app/(admin)/assignees/actions";
import type { AssigneeWithTaskCount } from "@/types";

export function AssigneesView({
  initialAssignees,
}: {
  initialAssignees: AssigneeWithTaskCount[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openAssigneeForm = useUIStore((state) => state.openAssigneeForm);

  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<AssigneeWithTaskCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: assignees = initialAssignees, isLoading, isError, refetch } =
    useAssignees(initialAssignees);

  // Client-side filter: the list is small and fully loaded, so searching it
  // here avoids a round trip per keystroke.
  const filtered = useMemo(() => {
    if (!search) return assignees;

    const term = search.toLowerCase();
    return assignees.filter(
      (assignee) =>
        assignee.name.toLowerCase().includes(term) ||
        assignee.email.toLowerCase().includes(term) ||
        assignee.role.toLowerCase().includes(term)
    );
  }, [assignees, search]);

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);
    const result = await deleteAssigneeAction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.assignees.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });

    // The action already phrases what happened to their tasks.
    toast.success(result.message);

    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Assignees
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {filtered.length} team {filtered.length === 1 ? "member" : "members"}
          </p>
        </div>

        <button
          onClick={() => openAssigneeForm()}
          className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold flex items-center justify-center gap-2 rounded-[10px] transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Assignee
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-4 rounded-[10px] shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or role..."
            aria-label="Search assignees"
            className="w-full pl-11 pr-4 py-2.5 bg-[#FBFBFB] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[10px] text-sm outline-none focus:border-[#066433] transition-all font-medium"
          />
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load assignees"
          description="Something went wrong. Please try again."
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold inline-flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
            >
              Retry
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No assignees found"
          description={
            search
              ? "No team members match your search."
              : "Add your first team member to start assigning tasks."
          }
          action={
            !search ? (
              <button
                onClick={() => openAssigneeForm()}
                className="px-4 py-2.5 bg-[#066433] hover:bg-[#066433]/90 text-white text-sm font-bold inline-flex items-center gap-2 rounded-[10px] transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Assignee
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((assignee) => (
            <AssigneeCard
              key={assignee.id}
              assignee={assignee}
              onEdit={(id) => openAssigneeForm(id)}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AssigneeForm assignees={assignees} />

      <ConfirmDialog
        open={pendingDelete !== null}
        loading={deleting}
        title={`Delete ${pendingDelete?.name ?? "this assignee"}?`}
        // Spelling out the consequence matters: tasks are kept, not deleted.
        description={
          pendingDelete && pendingDelete._count.tasks > 0
            ? `Their ${pendingDelete._count.tasks} ${
                pendingDelete._count.tasks === 1 ? "task" : "tasks"
              } will remain and become Unassigned. This cannot be undone.`
            : "This team member will be permanently removed. This cannot be undone."
        }
        confirmLabel="Delete assignee"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
