import { z } from "zod"

export const AssigneeCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(80, "Role must be 80 characters or fewer"),
})

export const AssigneeUpdateSchema = AssigneeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "No fields to update" }
)

export type AssigneeCreateInput = z.infer<typeof AssigneeCreateSchema>
export type AssigneeUpdateInput = z.infer<typeof AssigneeUpdateSchema>
