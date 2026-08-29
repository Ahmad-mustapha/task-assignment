import "server-only"

import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { Prisma } from "@/generated/prisma"

/** Field-level messages keyed by input name, for form display. */
export type FieldErrors = Record<string, string[]>

export function jsonError(message: string, status: number, fields?: FieldErrors) {
  return NextResponse.json({ error: message, fields }, { status })
}

export function unauthorized() {
  return jsonError("Not authenticated", 401)
}

export function notFound(resource = "Resource") {
  return jsonError(`${resource} not found`, 404)
}

/**
 * Single translation point from thrown errors to HTTP responses, so route
 * handlers can stay linear and never leak a stack trace to the client.
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 422, flattenZodError(error))
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint — almost always a duplicate assignee email.
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.[0]
      return jsonError(
        target ? `That ${target} is already in use` : "Duplicate value",
        409,
        target ? { [target]: ["Already in use"] } : undefined
      )
    }

    // Record not found for update/delete.
    if (error.code === "P2025") {
      return notFound()
    }

    // Foreign key violation — e.g. assigning to an assignee that was deleted.
    if (error.code === "P2003") {
      return jsonError("Referenced record does not exist", 400)
    }
  }

  console.error("[api]", error)
  return jsonError("Something went wrong", 500)
}

export function flattenZodError(error: ZodError): FieldErrors {
  const fields: FieldErrors = {}

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form"
    fields[key] ??= []
    fields[key].push(issue.message)
  }

  return fields
}
