import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getTaskById, updateTask, deleteTask } from "@/lib/data/tasks"
import { TaskUpdateSchema } from "@/lib/validation/task.schema"
import { handleApiError, unauthorized, notFound } from "@/lib/api-response"
import { rejectCrossOriginMutation } from "@/lib/request-security"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const task = await getTaskById(id)

    if (!task) return notFound("Task")

    return NextResponse.json(task)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PATCH — full edit or a status-only change; both go through the same schema. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const data = TaskUpdateSchema.parse(await request.json())

    const task = await updateTask(id, data)

    return NextResponse.json({ message: "Task updated", data: task })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const blocked = rejectCrossOriginMutation(_request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    await deleteTask(id)

    return NextResponse.json({ success: true, message: "Task deleted" })
  } catch (error) {
    return handleApiError(error)
  }
}
