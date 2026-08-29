import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"

const SAFE_REDIRECT_PATHS = ["/dashboard", "/tasks", "/assignees"]

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return "/dashboard"

  try {
    const decoded = decodeURIComponent(value)

    if (
      SAFE_REDIRECT_PATHS.some(
        (path) => decoded === path || decoded.startsWith(`${path}/`)
      )
    ) {
      return decoded
    }
  } catch {
    // Fall through to the safe default.
  }

  return "/dashboard"
}

export function rejectCrossOriginMutation(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin) return null

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")

  if (!host) return originError()

  try {
    if (new URL(origin).host === host) return null
  } catch {
    return originError()
  }

  return originError()
}

function originError() {
  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
}
