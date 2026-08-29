import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/auth/guards"
import { getDashboardStats } from "@/lib/data/tasks"
import { handleApiError, unauthorized } from "@/lib/api-response"

/** GET /api/dashboard/stats — the §2 overview counters. */
export async function GET() {
  try {
    const admin = await requireAdminApi()
    if (!admin) return unauthorized()

    return NextResponse.json(await getDashboardStats())
  } catch (error) {
    return handleApiError(error)
  }
}
