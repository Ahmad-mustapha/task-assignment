import { z } from "zod"

import { TASK_STATUSES, TASK_PRIORITIES } from "@/types"

export const TaskStatusSchema = z.enum(TASK_STATUSES)
export const TaskPrioritySchema = z.enum(TASK_PRIORITIES)

export const TaskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: TaskStatusSchema.default("TODO"),
  priority: TaskPrioritySchema.default("MEDIUM"),
  // Accepts an ISO string from JSON or a Date from a form action.
  dueDate: z.coerce.date().nullish(),
  // Empty select value means "unassigned".
  assigneeId: z
    .string()
    .nullish()
    .transform((value) => (value === "" ? null : value)),
})

// Every field optional on edit, but at least one must be present so a PATCH
// with an empty body is rejected rather than silently touching updatedAt.
export const TaskUpdateSchema = TaskCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "No fields to update" }
)

export const TaskStatusChangeSchema = z.object({
  status: TaskStatusSchema,
})

/** Query params for GET /api/tasks. */
export const TaskQuerySchema = z.object({
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  assigneeId: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>
