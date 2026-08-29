import "server-only"

import { prisma } from "@/lib/db"
import type {
  AssigneeCreateInput,
  AssigneeUpdateInput,
} from "@/lib/validation/assignee.schema"
import type { AssigneeWithTaskCount, TaskWithAssignee } from "@/types"

export async function getAssignees(): Promise<AssigneeWithTaskCount[]> {
  const assignees = await prisma.assignee.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  })

  return assignees as unknown as AssigneeWithTaskCount[]
}

export async function getAssigneeById(
  id: string
): Promise<AssigneeWithTaskCount | null> {
  const assignee = await prisma.assignee.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  })

  return assignee as unknown as AssigneeWithTaskCount | null
}

/** Tasks held by one assignee — powers the /assignees/[id] detail page. */
export async function getTasksByAssignee(
  assigneeId: string
): Promise<TaskWithAssignee[]> {
  const tasks = await prisma.task.findMany({
    where: { assigneeId },
    include: { assignee: true },
    orderBy: [{ status: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }],
  })

  return tasks as unknown as TaskWithAssignee[]
}

export async function findAssigneeByEmail(email: string) {
  return prisma.assignee.findUnique({ where: { email } })
}

export async function createAssignee(data: AssigneeCreateInput) {
  return prisma.assignee.create({ data })
}

export async function updateAssignee(id: string, data: AssigneeUpdateInput) {
  return prisma.assignee.update({ where: { id }, data })
}

/**
 * Deletes the assignee. Their tasks survive with assigneeId set to null
 * (schema `onDelete: SetNull`), so work is never lost — it shows as
 * "Unassigned" until reassigned.
 */
export async function deleteAssignee(id: string) {
  return prisma.assignee.delete({ where: { id } })
}

/** Count of unfinished tasks, used to warn before deleting. */
export async function countActiveTasks(assigneeId: string): Promise<number> {
  return prisma.task.count({
    where: { assigneeId, status: { not: "COMPLETED" } },
  })
}
