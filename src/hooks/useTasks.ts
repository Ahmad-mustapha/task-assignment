"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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

/**
 * Warms the next page so paging forward renders from cache. Called after the
 * current page loads; Query skips the fetch if the page is already cached.
 */
export function usePrefetchNextPage(
  filters: TaskFilters,
  currentPage: number,
  totalPages: number
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (currentPage >= totalPages) return

    const next = { ...filters, page: currentPage + 1 }

    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.list(next),
      queryFn: () =>
        apiFetch<Paginated<TaskWithAssignee>>(
          `/api/tasks?${buildTaskQuery(next)}`
        ),
    })
    // filters is rebuilt each render, so key off its serialised form.
  }, [queryClient, buildTaskQuery(filters), currentPage, totalPages]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Status changes are the one mutation frequent enough to be worth an
 * optimistic update — the badge flips instantly, and rolls back on error.
 */
export function useChangeTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    // Mutation endpoints answer with { message, data } so a caller can show
    // the server's own wording rather than inventing its own.
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<{ message: string; data: TaskWithAssignee }>(
        `/api/tasks/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      ),

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

    onError: (error, _variables, context) => {
      // Put every touched cache entry back the way it was.
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })

      toast.error(
        error instanceof Error ? error.message : "Could not update the status"
      )
    },

    onSuccess: (response) => {
      toast.success(response.message)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}
