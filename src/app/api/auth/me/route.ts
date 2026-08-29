import { NextResponse } from "next/server"

import { getCurrentAdmin } from "@/lib/auth/guards"
import { handleApiError, unauthorized } from "@/lib/api-response"

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return unauthorized()
    }

    return NextResponse.json({ admin })
  } catch (error) {
    return handleApiError(error)
  }
}
