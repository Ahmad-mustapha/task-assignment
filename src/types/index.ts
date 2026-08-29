// Shared types. Enum values mirror the Prisma schema so server and client
// agree on the same string literals.

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
}

export type Assignee = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export type AssigneeWithTaskCount = Assignee & {
  _count: { tasks: number }
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
  assigneeId: string | null
}

export type TaskWithAssignee = Task & {
  assignee: Assignee | null
}

/** Query params accepted by GET /api/tasks. */
export type TaskFilters = {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  search?: string
  sort?: "createdAt" | "dueDate" | "priority"
  order?: "asc" | "desc"
  page?: number
  pageSize?: number
}

/** Shape returned by every paginated list endpoint. */
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type DashboardStats = {
  totalTasks: number
  todo: number
  inProgress: number
  completed: number
  totalAssignees: number
  overdue: number
}
