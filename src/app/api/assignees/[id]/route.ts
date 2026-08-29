import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import {
  getAssigneeById,
  updateAssignee,
  deleteAssignee,
  countActiveTasks,
} from "@/lib/data/assignees"
import { AssigneeUpdateSchema } from "@/lib/validation/assignee.schema"
import { handleApiError, unauthorized, notFound } from "@/lib/api-response"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const assignee = await getAssigneeById(id)

    if (!assignee) return notFound("Assignee")

    return NextResponse.json(assignee)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const data = AssigneeUpdateSchema.parse(await request.json())

    return NextResponse.json(await updateAssignee(id, data))
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE — their tasks are unassigned rather than deleted (schema
 * `onDelete: SetNull`). The response reports how many were affected so the
 * UI can confirm what happened.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params

    // Counted before the delete, since the link is gone afterwards.
    const unassignedCount = await countActiveTasks(id)
    await deleteAssignee(id)

    return NextResponse.json({ success: true, unassignedCount })
  } catch (error) {
    return handleApiError(error)
  }
}
