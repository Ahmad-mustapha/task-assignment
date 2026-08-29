import "server-only"

import { prisma } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import type { TaskQueryInput } from "@/lib/validation/task.schema"
import type {
  TaskCreateInput,
  TaskUpdateInput,
} from "@/lib/validation/task.schema"
import type { Paginated, TaskWithAssignee, DashboardStats } from "@/types"

// Every task read returns its assignee so the UI never needs a second query.
const withAssignee = { assignee: true } satisfies Prisma.TaskInclude

function buildWhere(filters: TaskQueryInput): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {}

  if (filters.status) where.status = filters.status
  if (filters.priority) where.priority = filters.priority

  // The sentinel "unassigned" filters for tasks with no assignee, which a
  // plain id comparison cannot express.
  if (filters.assigneeId) {
    where.assigneeId =
      filters.assigneeId === "unassigned" ? null : filters.assigneeId
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  return where
}

function buildOrderBy(
  filters: TaskQueryInput
): Prisma.TaskOrderByWithRelationInput[] {
  const { sort, order } = filters

  if (sort === "dueDate") {
    // Undated tasks sort last regardless of direction — a null due date is
    // "no deadline", not "earliest deadline".
    return [{ dueDate: { sort: order, nulls: "last" } }, { createdAt: "desc" }]
  }

  return [{ [sort]: order }, { createdAt: "desc" }]
}

export async function getTasks(
  filters: TaskQueryInput
): Promise<Paginated<TaskWithAssignee>> {
  const where = buildWhere(filters)
  const skip = (filters.page - 1) * filters.pageSize

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: withAssignee,
      orderBy: buildOrderBy(filters),
      skip,
      take: filters.pageSize,
    }),
    prisma.task.count({ where }),
  ])

  return {
    items: items as unknown as TaskWithAssignee[],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getTaskById(
  id: string
): Promise<TaskWithAssignee | null> {
  const task = await prisma.task.findUnique({
    where: { id },
    include: withAssignee,
  })

  return task as unknown as TaskWithAssignee | null
}

export async function createTask(data: TaskCreateInput) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ?? null,
      assigneeId: data.assigneeId ?? null,
    },
    include: withAssignee,
  })
}

export async function updateTask(id: string, data: TaskUpdateInput) {
  return prisma.task.update({
    where: { id },
    data: {
      // Spread only the keys actually present so a partial update never
      // overwrites untouched columns with undefined.
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description ?? null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ?? null }),
      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId ?? null,
      }),
    },
    include: withAssignee,
  })
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } })
}

export async function getRecentTasks(limit = 5): Promise<TaskWithAssignee[]> {
  const tasks = await prisma.task.findMany({
    include: withAssignee,
    orderBy: { updatedAt: "desc" },
    take: limit,
  })

  return tasks as unknown as TaskWithAssignee[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()

  const [byStatus, totalAssignees, overdue] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.assignee.count(),
    // Overdue means past due and not yet finished.
    prisma.task.count({
      where: { dueDate: { lt: now }, status: { not: "COMPLETED" } },
    }),
  ])

  const countFor = (status: string) =>
    byStatus.find((row) => row.status === status)?._count ?? 0

  const todo = countFor("TODO")
  const inProgress = countFor("IN_PROGRESS")
  const completed = countFor("COMPLETED")

  return {
    totalTasks: todo + inProgress + completed,
    todo,
    inProgress,
    completed,
    totalAssignees,
    overdue,
  }
}
