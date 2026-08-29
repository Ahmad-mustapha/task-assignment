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
import { rejectCrossOriginMutation } from "@/lib/request-security"

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
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params
    const data = AssigneeUpdateSchema.parse(await request.json())

    const assignee = await updateAssignee(id, data)

    return NextResponse.json({ message: "Assignee updated", data: assignee })
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
    const blocked = rejectCrossOriginMutation(_request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params

    // Counted before the delete, since the link is gone afterwards.
    const unassignedCount = await countActiveTasks(id)
    await deleteAssignee(id)

    return NextResponse.json({
      success: true,
      unassignedCount,
      // Naming the consequence here keeps the API honest about what a delete
      // actually did, not just that it succeeded.
      message:
        unassignedCount > 0
          ? `Assignee deleted. ${unassignedCount} ${
              unassignedCount === 1 ? "task is" : "tasks are"
            } now unassigned.`
          : "Assignee deleted",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
