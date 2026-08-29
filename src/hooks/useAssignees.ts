"use client"

import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { AssigneeWithTaskCount } from "@/types"

/**
 * Assignees change rarely, so this mainly feeds the "Assignee" filter dropdown
 * and the task form's select without refetching on every open.
 */
export function useAssignees(initialData?: AssigneeWithTaskCount[]) {
  return useQuery({
    queryKey: queryKeys.assignees.list(),
    queryFn: () => apiFetch<AssigneeWithTaskCount[]>("/api/assignees"),
    initialData,
    // Uses the shared 30s staleTime. A longer window looked like a win, but
    // task mutations change each assignee's count, and invalidation overrides
    // staleTime anyway — so the two settings just disagreed.
  })
}
