import "server-only"

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { z } from "zod"

export const SESSION_COOKIE = "session"

const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  adminId: string
  email: string
  name: string
}

const SessionPayloadSchema = z.object({
  adminId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
})

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  // Fail loudly rather than signing tokens with an empty key.
  if (!secret) {
    throw new Error("JWT_SECRET is not set")
  }

  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

/**
 * Returns null for any invalid token — expired, tampered, or malformed —
 * so callers treat "bad token" and "no token" identically.
 */
export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    })

    return SessionPayloadSchema.parse(payload)
  } catch {
    return null
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable by client JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
