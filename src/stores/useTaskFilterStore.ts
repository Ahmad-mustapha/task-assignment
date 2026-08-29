import { create } from "zustand"

import type { TaskStatus, TaskPriority } from "@/types"

/**
 * Client-only filter state. Kept out of TanStack Query because these are UI
 * selections, not server data — Query then keys off the resulting filter
 * object and fetches when it changes.
 */
type SortField = "createdAt" | "dueDate" | "priority"
type SortOrder = "asc" | "desc"

type TaskFilterState = {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  search: string
  page: number
  sort: SortField
  order: SortOrder

  setStatus: (status?: TaskStatus) => void
  setPriority: (priority?: TaskPriority) => void
  setAssignee: (assigneeId?: string) => void
  setSearch: (search: string) => void
  setPage: (page: number) => void
  setSort: (sort: SortField, order: SortOrder) => void
  reset: () => void
}

const initialState = {
  status: undefined,
  priority: undefined,
  assigneeId: undefined,
  search: "",
  page: 1,
  // Newest first matches what an admin expects to see on arrival.
  sort: "createdAt" as SortField,
  order: "desc" as SortOrder,
}

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  ...initialState,

  // Changing any filter resets to page 1 — staying on page 4 of a narrower
  // result set would show an empty list.
  setStatus: (status) => set({ status, page: 1 }),
  setPriority: (priority) => set({ priority, page: 1 }),
  setAssignee: (assigneeId) => set({ assigneeId, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  setSort: (sort, order) => set({ sort, order, page: 1 }),
  reset: () => set(initialState),
}))
