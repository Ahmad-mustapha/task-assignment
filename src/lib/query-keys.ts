import type { TaskFilters } from "@/types"

/**
 * The dashboard's chart window. Shared so the server seeds exactly the query
 * the client hook asks for — a mismatch would refetch on every mount.
 */
export const DASHBOARD_TASK_QUERY = { page: 1, pageSize: 100 } as const

/**
 * Single source of truth for cache keys. Mutations invalidate by prefix:
 * `queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })`.
 */
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    list: (filters: TaskFilters) => ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  assignees: {
    all: ["assignees"] as const,
    list: () => ["assignees", "list"] as const,
    detail: (id: string) => ["assignees", "detail", id] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
  },
} as const

/** Serialises filters into a querystring, dropping empty values. */
export function buildTaskQuery(filters: TaskFilters): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }

  return params.toString()
}
