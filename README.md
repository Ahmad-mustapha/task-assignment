# Task Assign - Task Assignment Dashboard

Internal admin tool for managing team members, assigning tasks, and tracking
progress. Built with Next.js (App Router), TypeScript, Prisma and Postgres.

## Admin credentials

```
admin1@example.com
Password@12
```

## Stack

Next.js 16 · TypeScript · Prisma 6 · Supabase Postgres · TanStack Query ·
Zustand · Zod · Tailwind CSS v4 · shadcn/ui · Recharts · date-fns

## Setup instructions

```bash
pnpm install
cp .env.example .env     # then fill in the values below
pnpm db:migrate          # create tables
pnpm db:seed             # admin + 5 assignees + 12 sample tasks
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

This project uses **pnpm**. Other package managers will work but the lockfile
is pnpm's.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection (PgBouncer, port 6543) used at runtime |
| `DIRECT_URL` | Session connection (port 5432) used by Prisma Migrate |
| `JWT_SECRET` | Signing key for the session token |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database setup instructions

Any Postgres works. This project uses Supabase's free tier.

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string**.
3. Take the **Transaction pooler** URI (port 6543) for `DATABASE_URL`.
4. Take the same host on **port 5432** for `DIRECT_URL`.
5. Run `pnpm db:migrate` then `pnpm db:seed`.

Two URLs are needed because Prisma Migrate uses advisory locks and prepared
statements that a transaction pooler cannot hold. Percent-encode special
characters in the password (`@` becomes `%40`).

Avoid the legacy `db.<ref>.supabase.co` direct host — it resolves to IPv6
only and fails on networks without IPv6.

## Authentication approach

Credentials-based, no third-party provider:

- Passwords hashed with bcrypt; only the hash is stored.
- On login a JWT is signed with `jose` and set as an **httpOnly** cookie, so
  client JavaScript cannot read it.
- `middleware.ts` verifies the token before protected pages render and redirects unauthenticated
  requests to `/login`, preserving the intended path in `?from=`.
- Server components call `requireAdmin()` and route handlers call
  `requireAdminApi()`, so **authorisation never depends on client logic** —
  the edge check is a redirect convenience, not the security boundary.
- Login compares against a dummy hash when the email is unknown, so response
  timing does not reveal which accounts exist.
- Login return paths are allow-listed to internal app routes.
- JSON mutation routes reject cross-origin browser requests. Server Actions
  also use Next.js's built-in Origin-vs-Host CSRF check.
- **Rate limited to 5 attempts per 5 minutes per client.** Exceeding it
  returns `429` with a `resetAt` timestamp; the login page disables the form
  and counts down until the window lifts. A correct password is refused while
  locked, and the counter clears on a successful sign-in.

Registration, password reset and multiple roles are out of scope.

## Architecture

```
src/
  app/
    login/                  public
    (admin)/                dashboard, tasks, assignees
      */actions.ts          server actions — all mutations
      loading.tsx           route-level loading state
      error.tsx             route-level error boundary
    api/                    route handlers — all reads
  lib/
    data/                   the ONLY place Prisma is called
    auth/                   session signing, guards
    validation/             Zod schemas, shared by actions and routes
    rate-limit.ts           login attempt limiter
    trends.ts               chart series derived from tasks
  hooks/                    TanStack Query wrappers
  stores/                   Zustand — filter and modal state
  components/               ui primitives + feature components
```

**Server/client split.** Server components read `lib/data/` directly — no HTTP
hop and no loading spinner on first paint. TanStack Query handles only what
refetches after interaction (the filtered task list), receiving the server's
first page as `initialData` so there is no duplicate fetch on mount.

**Mutations vs reads.** Server actions handle create/update/delete; route
handlers serve reads. Each has one job, so write logic is never duplicated.

## API

| Method | Route |
|---|---|
| POST | `/api/auth/login`, `/api/auth/logout` |
| GET | `/api/auth/me` |
| GET · POST | `/api/tasks` |
| GET · PATCH · DELETE | `/api/tasks/[id]` |
| GET · POST | `/api/assignees` |
| GET · PATCH · DELETE | `/api/assignees/[id]` |
| GET | `/api/assignees/[id]/tasks` |
| GET | `/api/dashboard/stats` |

`GET /api/tasks` accepts `status`, `priority`, `assigneeId`, `search`, `sort`,
`order`, `page` and `pageSize`. Passing `assigneeId=unassigned` returns tasks
with no assignee.

Mutations answer with `{ message, data }` so the UI shows the server's own
wording rather than inventing its own. Failures answer with
`{ error, fields? }`, where `fields` maps input names to messages that forms
render inline.

## Key technical decisions

**Deleting an assignee unassigns their tasks.** The `Task.assigneeId` relation
uses `onDelete: SetNull`, so removing a team member leaves their work in place
as "Unassigned" rather than deleting it or blocking the removal. Losing task
records to a personnel change would be the worse failure, and blocking
deletion until every task is reassigned turns a one-click action into a chore.
The delete response returns `unassignedCount`, and both the confirmation
dialog and the success toast state exactly how many tasks were affected.

**Validation lives in `lib/validation/`** and is imported by both server
actions and route handlers, so every write is validated server-side by the
same schema regardless of entry point.

**Errors are mapped centrally** in `lib/api-response.ts`: Zod → 422, unique
constraint → 409, missing record → 404, everything else → 500 with the detail
logged server-side and never returned to the client.

**Chart data is derived, not stored.** `lib/trends.ts` buckets the task list
the page already has into per-day created/completed counts. A dedicated
endpoint for a bonus-feature chart would not have earned its complexity.

**`POST /api/tasks` and `POST /api/assignees` duplicate the server actions.**
This is deliberate: the actions serve the UI, and the REST surface stays
complete for any API consumer. Both paths share the same Zod schemas and data
layer, so there is no duplicated business logic — only two entry points.

**Optimistic updates on the one mutation that earns them.** Changing a task's
status from the list flips the badge before the request lands and rolls back
on failure. Other mutations close a dialog on completion, where an optimistic
update would not be visible.

**Prisma 6, not 8.** The 8.x release line is a platform CLI without `generate`
or `migrate`, so it cannot drive a conventional schema workflow.

**Theme is class-based** and defaults to light with an explicit toggle in the
header.

**Font is Arial-first** with comprehensive fallbacks including system fonts.

**Deployment-ready** with proper Vercel configuration and routing fixes for SPA navigation.

## Features

### Core

Admin login with protected routes · dashboard overview · full task CRUD with
assignment and status changes · full assignee CRUD with their task list ·
filtering by status, priority and assignee.

### Additional

| Feature | Notes |
|---|---|
| **Search** | Debounced 300ms over title and description |
| **Pagination** | Server-side, page size 10 |
| **Sorting** | Six orders: newest, oldest, due soonest/latest, priority both ways |
| **Optimistic updates** | Status changes from the task list, with rollback |
| **Toast notifications** | Every mutation, using the server's message |
| **Dark mode** | Explicit light/dark toggle |
| **Dashboard charts** | Created, completed, and status breakdown (Recharts) |
| **CSV export** | Dashboard stats, trends and recent tasks |
| **Login rate limiting** | 5 attempts / 5 minutes with a live countdown |
| **Error boundaries** | Comprehensive error handling prevents UI crashes |
| **Mobile-optimized modals** | Task forms properly sized for mobile devices |

## Assumptions

- One admin account; assignees are records, not users, and never log in.
- A task may exist with no assignee and no due date.
- "Overdue" means past the due date and not yet Completed.
- Seed data is reset on each `pnpm db:seed` run.
- `updatedAt` is the closest available signal for when a task was completed,
  since there is no separate completion timestamp.

## Known limitations

- Rate limiting is in-memory, so on a multi-instance deploy each instance
  counts separately. Set `TRUST_PROXY_HEADERS=true` only behind a trusted proxy
  that normalizes forwarded IP headers. A shared store would be needed in
  production.
- Search is a case-insensitive substring match, not full-text search.
- Session expiry is fixed at 7 days with no refresh.
- Chart trends are derived from the first 100 tasks, so a much larger dataset
  would need a dedicated aggregate endpoint.
- No automated tests.

## Features I would add with more time

### Enhanced User Experience
- **Drag-and-drop task management** - Kanban board view with drag-and-drop status changes
- **Bulk operations** - Select multiple tasks for bulk status updates, reassignment, or deletion
- **Advanced task filtering** - Date ranges, custom filters, saved filter presets
- **Real-time notifications** - WebSocket updates when tasks are assigned or status changes
- **Activity history** - Timeline of all actions taken on tasks and assignees
- **Task templates** - Predefined task structures for common workflows

### Performance & Scalability
- **Infinite scroll pagination** - Replace traditional pagination for better UX
- **Advanced caching** - Redis for session storage and query caching
- **Full-text search** - PostgreSQL full-text search or Elasticsearch integration
- **Performance monitoring** - Error tracking and performance metrics

### Administration & Analytics
- **Dashboard analytics** - Advanced charts, workload distribution, productivity metrics
- **Email notifications** - Task assignments, due date reminders, status updates
- **CSV/Excel export** - Export filtered task lists and reports
- **Audit logs** - Complete history of all system changes
- **User roles & permissions** - Multiple admin levels, team leads, read-only access

### Technical Improvements
- **Automated testing** - Unit, integration, and end-to-end test suites
- **API documentation** - OpenAPI/Swagger documentation for REST endpoints
- **Database backups** - Automated backup and restore procedures
- **CI/CD pipeline** - Automated testing, building, and deployment
- **Mobile app** - React Native or PWA for mobile access
- **Internationalization** - Multi-language support
