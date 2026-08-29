import { create } from "zustand"

/** Modal/drawer state, kept global so any component can open a dialog. */
type UIState = {
  taskFormOpen: boolean
  editingTaskId: string | null
  assigneeFormOpen: boolean
  editingAssigneeId: string | null

  openTaskForm: (taskId?: string) => void
  closeTaskForm: () => void
  openAssigneeForm: (assigneeId?: string) => void
  closeAssigneeForm: () => void
}

export const useUIStore = create<UIState>((set) => ({
  taskFormOpen: false,
  editingTaskId: null,
  assigneeFormOpen: false,
  editingAssigneeId: null,

  // A set id means "edit"; undefined means "create".
  openTaskForm: (taskId) =>
    set({ taskFormOpen: true, editingTaskId: taskId ?? null }),
  closeTaskForm: () => set({ taskFormOpen: false, editingTaskId: null }),

  openAssigneeForm: (assigneeId) =>
    set({ assigneeFormOpen: true, editingAssigneeId: assigneeId ?? null }),
  closeAssigneeForm: () =>
    set({ assigneeFormOpen: false, editingAssigneeId: null }),
}))
