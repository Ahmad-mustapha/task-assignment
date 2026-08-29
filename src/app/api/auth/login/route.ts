import { NextResponse, type NextRequest } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { createSessionCookie } from "@/lib/auth/session"
import { LoginSchema } from "@/lib/validation/auth.schema"
import { handleApiError, jsonError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
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
      return jsonError("Invalid email or password", 401)
    }

    await createSessionCookie({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    })

    return NextResponse.json({
      admin: { id: admin.id, email: admin.email, name: admin.name },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
