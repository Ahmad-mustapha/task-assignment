import "server-only"

import { redirect } from "next/navigation"

import { readSession, type SessionPayload } from "@/lib/auth/session"

/** Current admin, or null. Use when absence is a valid state. */
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  return readSession()
}

/**
 * Server-component guard: returns the admin or redirects to /login.
 *
 * proxy.ts already blocks unauthenticated navigation, but that runs on the
 * Edge before rendering. Re-checking here means a page can never render
 * without a verified session even if the matcher is misconfigured.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await readSession()

  if (!admin) {
    redirect("/login")
  }

  return admin
}

/** Route-handler guard: returns the admin or null for a 401. */
export async function requireAdminApi(): Promise<SessionPayload | null> {
  return readSession()
}
