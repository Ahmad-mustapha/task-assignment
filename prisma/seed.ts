import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const ADMIN_EMAIL = "admin1@example.com"
const ADMIN_PASSWORD = "Password@12"

/** Days from today, for readable relative due dates. */
function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(12, 0, 0, 0)
  return date
}

const ASSIGNEES = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", role: "Product Designer" },
  { name: "Marcus Reid", email: "marcus.reid@example.com", role: "Frontend Engineer" },
  { name: "Priya Nair", email: "priya.nair@example.com", role: "Backend Engineer" },
  { name: "Tom Okafor", email: "tom.okafor@example.com", role: "QA Analyst" },
  { name: "Elena Vasquez", email: "elena.vasquez@example.com", role: "Project Manager" },
]

async function main() {
  console.log("Seeding database...")

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  // Only one admin exists; clear any previous row so changing the seeded
  // credentials does not leave a stale account able to log in.
  await prisma.admin.deleteMany({ where: { email: { not: ADMIN_EMAIL } } })

  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    // Re-seeding refreshes the hash, so changing ADMIN_PASSWORD takes effect.
    update: { passwordHash },
    create: { email: ADMIN_EMAIL, passwordHash, name: "Admin User" },
  })

  // Upsert by email so re-running the seed does not duplicate anyone.
  const assignees = await Promise.all(
    ASSIGNEES.map((assignee) =>
      prisma.assignee.upsert({
        where: { email: assignee.email },
        update: {},
        create: assignee,
      })
    )
  )

  const [sarah, marcus, priya, tom, elena] = assignees

  // Cleared each run so the sample set stays predictable.
  await prisma.task.deleteMany()

  await prisma.task.createMany({
    data: [
      {
        title: "Redesign the onboarding flow",
        description:
          "Rework the three-step signup into a single screen with progressive disclosure.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(3),
        assigneeId: sarah.id,
      },
      {
        title: "Fix pagination on the tasks table",
        description: "Page size resets to 10 when a filter is applied.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(7),
        assigneeId: marcus.id,
      },
      {
        title: "Add rate limiting to the auth endpoint",
        description: "Cap login attempts at 5 per minute per IP.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(-2), // overdue
        assigneeId: priya.id,
      },
      {
        title: "Write regression tests for task filters",
        description: "Cover status, priority, and assignee combinations.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(5),
        assigneeId: tom.id,
      },
      {
        title: "Draft the Q3 roadmap",
        description: "Summarise committed work and open capacity.",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        dueDate: daysFromNow(-10),
        assigneeId: elena.id,
      },
      {
        title: "Audit colour contrast for accessibility",
        description: "Check all badge and button variants against WCAG AA.",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(-5),
        assigneeId: sarah.id,
      },
      {
        title: "Migrate file uploads to object storage",
        description: "Move from local disk to S3-compatible storage.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: daysFromNow(21),
        assigneeId: priya.id,
      },
      {
        title: "Investigate slow dashboard queries",
        description: "The stats endpoint takes ~2s with 10k tasks.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(-1), // overdue
        assigneeId: marcus.id,
      },
      {
        title: "Update the component library docs",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: daysFromNow(14),
        assigneeId: tom.id,
      },
      {
        title: "Set up error monitoring",
        description: "Wire Sentry into the app and alert on 5xx spikes.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(10),
        assigneeId: elena.id,
      },
      {
        title: "Consolidate duplicate email templates",
        description: "Three near-identical templates should share one layout.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: null,
        assigneeId: null, // exercises the unassigned + no-due-date states
      },
      {
        title: "Review vendor security questionnaire",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(2),
        assigneeId: null,
      },
    ],
  })

  const taskCount = await prisma.task.count()
  console.log(
    `Seeded ${assignees.length} assignees, ${taskCount} tasks, 1 admin.`
  )
  console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
