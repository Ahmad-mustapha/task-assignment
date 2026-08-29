import "server-only"

import { redirect } from "next/navigation"

import { readSession, type SessionPayload } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

/** Current admin, or null. Use when absence is a valid state. */
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  const session = await readSession()
  if (!session) return null

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true, email: true, name: true },
    })

    if (!admin) return null

    return { adminId: admin.id, email: admin.email, name: admin.name }
  } catch (error) {
    console.error("[auth] Could not verify admin session", error)
    return null
  }
}

/**
 * Server-component guard: returns the admin or redirects to /login.
 *
 * middleware.ts already blocks unauthenticated navigation, but that runs on the
 * Edge before rendering. Re-checking here means a page can never render
 * without a verified session even if the matcher is misconfigured.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect("/login")
  }

  return admin
}

/** Route-handler guard: returns the admin or null for a 401. */
export async function requireAdminApi(): Promise<SessionPayload | null> {
  return getCurrentAdmin()
}
