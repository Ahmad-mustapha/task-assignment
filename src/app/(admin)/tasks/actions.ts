"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/guards"
import * as tasksData from "@/lib/data/tasks"
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskStatusChangeSchema,
} from "@/lib/validation/task.schema"
import { flattenZodError, type FieldErrors } from "@/lib/api-response"
import { STATUS_LABELS } from "@/types"
import { ZodError } from "zod"

/** Uniform result so forms can render field errors without throwing. */
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

  console.error("[action]", error)
  return { success: false, error: "Something went wrong. Please try again." }
}

function revalidateTaskViews(id?: string) {
  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  if (id) revalidatePath(`/tasks/${id}`)
}

export async function createTaskAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const data = TaskCreateSchema.parse(input)
    const task = await tasksData.createTask(data)

    revalidateTaskViews()
    return { success: true, data: { id: task.id }, message: "Task created" }
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateTaskAction(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const data = TaskUpdateSchema.parse(input)
    const task = await tasksData.updateTask(id, data)

    revalidateTaskViews(id)
    return { success: true, data: { id: task.id }, message: "Task updated" }
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await tasksData.deleteTask(id)

    revalidateTaskViews()
    return { success: true, data: undefined, message: "Task deleted" }
  } catch (error) {
    return toActionError(error)
  }
}

/** Status-only change, used by the board/dropdown without a full edit. */
export async function changeTaskStatusAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    await requireAdmin()

    const { status } = TaskStatusChangeSchema.parse(input)
    await tasksData.updateTask(id, { status })

    revalidateTaskViews(id)
    return {
      success: true,
      data: undefined,
      message: `Moved to ${STATUS_LABELS[status]}`,
    }
  } catch (error) {
    return toActionError(error)
  }
}
