import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getTaskById, updateTask, deleteTask } from "@/lib/data/tasks"
import { TaskUpdateSchema } from "@/lib/validation/task.schema"
import { handleApiError, unauthorized, notFound } from "@/lib/api-response"

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
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const data = TaskUpdateSchema.parse(await request.json())

    return NextResponse.json(await updateTask(id, data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    await deleteTask(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
