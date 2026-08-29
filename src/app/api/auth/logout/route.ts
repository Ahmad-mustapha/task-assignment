import { NextResponse, type NextRequest } from "next/server"

import { clearSessionCookie } from "@/lib/auth/session"
import { handleApiError } from "@/lib/api-response"
import { rejectCrossOriginMutation } from "@/lib/request-security"

export async function POST(request: NextRequest) {
  try {
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    await clearSessionCookie()
    return NextResponse.json({ success: true, message: "Signed out" })
  } catch (error) {
    return handleApiError(error)
  }
}
