"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api-client"
import { queryKeys, buildTaskQuery } from "@/lib/query-keys"
import type { TaskFilters, TaskWithAssignee, Paginated } from "@/types"

/**
 * Filtered task list. The server component renders the first page and passes
 * it as `initialData`, so there is no loading flash on mount — Query only
 * fetches once the filters change.
 */
export function useTasks(
  filters: TaskFilters,
  initialData?: Paginated<TaskWithAssignee>
) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () =>
      apiFetch<Paginated<TaskWithAssignee>>(
        `/api/tasks?${buildTaskQuery(filters)}`
      ),
    initialData,
    placeholderData: (previous) => previous,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => apiFetch<TaskWithAssignee>(`/api/tasks/${id}`),
    enabled: Boolean(id),
  })
}

/**
 * Status changes are the one mutation frequent enough to be worth an
 * optimistic update — the badge flips instantly, and rolls back on error.
 */
export function useChangeTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<TaskWithAssignee>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.all,
      })

      queryClient.setQueriesData<Paginated<TaskWithAssignee>>(
        { queryKey: queryKeys.tasks.all },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((task) =>
                  task.id === id
                    ? { ...task, status: status as TaskWithAssignee["status"] }
                    : task
                ),
              }
            : old
      )

      return { previous }
    },

    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}
