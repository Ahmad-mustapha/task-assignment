import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "session"

/**
 * Runs on the Edge before any protected page renders. It verifies the JWT
 * inline rather than importing lib/auth/session, which depends on
 * next/headers and is server-only.
 *
 * This is a gate, not the only check — server components call requireAdmin()
 * and route handlers call requireAdminApi(), so a bypass here still cannot
 * reach data.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthenticated = await isValidSession(token)

  // Signed-in admins have no reason to see the login page.
  if (pathname === "/login") {
    return isAuthenticated
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    // Remember where they were headed so login can send them back.
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.JWT_SECRET) return false

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), {
      algorithms: ["HS256"],
    })
    return true
  } catch {
    return false
  }
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/tasks/:path*", "/assignees/:path*"],
}
