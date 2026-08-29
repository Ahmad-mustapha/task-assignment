"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAdmin } from "@/lib/auth/guards"
import * as assigneesData from "@/lib/data/assignees"
import {
  AssigneeCreateSchema,
  AssigneeUpdateSchema,
} from "@/lib/validation/assignee.schema"
import { flattenZodError, type FieldErrors } from "@/lib/api-response"
import { Prisma } from "@/generated/prisma"

export type ActionResult<T = void> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; fields?: FieldErrors }

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      success: false,
      error: "Please fix the highlighted fields",
      fields: flattenZodError(error),
    }
  }

  // Duplicate email is the one conflict worth naming precisely.
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      success: false,
      error: "That email is already in use",
      fields: { email: ["Already in use"] },
    }
  }

  console.error("[action]", error)
  return { success: false, error: "Something went wrong. Please try again." }
}

function revalidateAssigneeViews(id?: string) {
  revalidatePath("/assignees")
  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  if (id) revalidatePath(`/assignees/${id}`)
}

export async function createAssigneeAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const data = AssigneeCreateSchema.parse(input)
    const assignee = await assigneesData.createAssignee(data)

    revalidateAssigneeViews()
    return {
      success: true,
      data: { id: assignee.id },
      message: "Assignee added",
    }
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateAssigneeAction(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const data = AssigneeUpdateSchema.parse(input)
    const assignee = await assigneesData.updateAssignee(id, data)

    revalidateAssigneeViews(id)
    return {
      success: true,
      data: { id: assignee.id },
      message: "Assignee updated",
    }
  } catch (error) {
    return toActionError(error)
  }
}

/**
 * Deleting unassigns rather than cascades: their tasks stay and become
 * "Unassigned". Returns the count so the UI can confirm what changed.
 */
export async function deleteAssigneeAction(
  id: string
): Promise<ActionResult<{ unassignedCount: number }>> {
  try {
    await requireAdmin()

    const unassignedCount = await assigneesData.countActiveTasks(id)
    await assigneesData.deleteAssignee(id)

    revalidateAssigneeViews()
    return {
      success: true,
      data: { unassignedCount },
      // Says what actually happened to their work, not just that it worked.
      message:
        unassignedCount > 0
          ? `Assignee deleted. ${unassignedCount} ${
              unassignedCount === 1 ? "task is" : "tasks are"
            } now unassigned.`
          : "Assignee deleted",
    }
  } catch (error) {
    return toActionError(error)
  }
}
