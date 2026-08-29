import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/lib/auth/session"
import { handleApiError } from "@/lib/api-response"

export async function POST() {
  try {
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
