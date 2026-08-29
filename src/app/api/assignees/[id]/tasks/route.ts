import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getAssigneeById, getTasksByAssignee } from "@/lib/data/assignees"
import { handleApiError, unauthorized, notFound } from "@/lib/api-response"

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/assignees/[id]/tasks — §4 "view tasks assigned to an assignee". */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const { id } = await params

    if (!(await getAssigneeById(id))) return notFound("Assignee")

    return NextResponse.json(await getTasksByAssignee(id))
  } catch (error) {
    return handleApiError(error)
  }
}
