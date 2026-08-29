import { NextResponse, type NextRequest } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { createSessionCookie } from "@/lib/auth/session"
import { LoginSchema } from "@/lib/validation/auth.schema"
import { handleApiError } from "@/lib/api-response"
import {
  checkRateLimit,
  recordFailure,
  clearRateLimit,
  clientKey,
} from "@/lib/rate-limit"
import { rejectCrossOriginMutation } from "@/lib/request-security"

export async function POST(request: NextRequest) {
  const key = clientKey(request)

  try {
    const blocked = rejectCrossOriginMutation(request)
    if (blocked) return blocked

    // Checked before any work so a locked-out client cannot keep hashing.
    const limit = checkRateLimit(key)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again shortly.",
          resetAt: limit.resetAt,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)

    const admin = await prisma.admin.findUnique({ where: { email } })

    // Compare against a dummy hash when the admin is missing so the response
    // time does not reveal whether the email exists.
    const passwordHash =
      admin?.passwordHash ??
      "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv"
    const valid = await bcrypt.compare(password, passwordHash)

    if (!admin || !valid) {
      const after = recordFailure(key)

      // The attempt that exhausts the window answers 429, so the client can
      // start its countdown immediately rather than on the next try.
      if (!after.allowed) {
        return NextResponse.json(
          {
            error: "Too many login attempts. Please try again shortly.",
            resetAt: after.resetAt,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: "Invalid email or password",
          remaining: after.remaining,
        },
        { status: 401 }
      )
    }

    clearRateLimit(key)

    await createSessionCookie({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    })

    return NextResponse.json({
      message: "Signed in",
      admin: { id: admin.id, email: admin.email, name: admin.name },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
