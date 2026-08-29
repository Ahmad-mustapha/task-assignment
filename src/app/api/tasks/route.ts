import { NextResponse, type NextRequest } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getTasks, createTask } from "@/lib/data/tasks"
import {
  TaskQuerySchema,
  TaskCreateSchema,
} from "@/lib/validation/task.schema"
import { handleApiError, unauthorized } from "@/lib/api-response"
import { rejectCrossOriginMutation } from "@/lib/request-security"

/** GET /api/tasks — filter, search, sort, paginate. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const filters = TaskQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    )

    return NextResponse.json(await getTasks(filters))
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/tasks — kept alongside the server action so the API is complete. */
export async function POST(request: NextRequest) {
  try {
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    const data = TaskCreateSchema.parse(await request.json())
    const task = await createTask(data)

    return NextResponse.json(
      { message: "Task created", data: task },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
