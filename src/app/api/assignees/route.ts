import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getAssignees, createAssignee } from "@/lib/data/assignees"
import { AssigneeCreateSchema } from "@/lib/validation/assignee.schema"
import { handleApiError, unauthorized } from "@/lib/api-response"
import { rejectCrossOriginMutation } from "@/lib/request-security"

/** GET /api/assignees — full list with each assignee's task count. */
export async function GET() {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    return NextResponse.json(await getAssignees())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const data = AssigneeCreateSchema.parse(await request.json())
    const assignee = await createAssignee(data)

    return NextResponse.json(
      { message: "Assignee added", data: assignee },
      { status: 201 }
    )
  } catch (error) {
    // Duplicate email surfaces as a 409 via handleApiError.
    return handleApiError(error)
  }
}
