import { create } from "zustand"

import type { TaskFilters, TaskStatus, TaskPriority } from "@/types"

/**
 * Client-only filter state. Kept out of TanStack Query because these are UI
 * selections, not server data — Query then keys off the resulting filter
 * object and fetches when it changes.
 */
type TaskFilterState = {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  search: string
  page: number

  setStatus: (status?: TaskStatus) => void
  setPriority: (priority?: TaskPriority) => void
  setAssignee: (assigneeId?: string) => void
  setSearch: (search: string) => void
  setPage: (page: number) => void
  reset: () => void

  toFilters: () => TaskFilters
}

const initialState = {
  status: undefined,
  priority: undefined,
  assigneeId: undefined,
  search: "",
  page: 1,
}

export const useTaskFilterStore = create<TaskFilterState>((set, get) => ({
  ...initialState,

  // Changing any filter resets to page 1 — staying on page 4 of a narrower
  // result set would show an empty list.
  setStatus: (status) => set({ status, page: 1 }),
  setPriority: (priority) => set({ priority, page: 1 }),
  setAssignee: (assigneeId) => set({ assigneeId, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(initialState),

  toFilters: () => {
    const { status, priority, assigneeId, search, page } = get()
    return { status, priority, assigneeId, search: search || undefined, page }
  },
}))
