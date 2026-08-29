# Task Dashboard

Admin dashboard for managing tasks and assignees.

## Stack

Next.js (App Router) · Prisma · TanStack Query · Zustand · Zod · Tailwind CSS v4 · shadcn/ui

## Getting Started

Fill in `.env`:

```
DATABASE_URL=
JWT_SECRET=
```

Then:

```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
prisma/          schema + seed
src/app/         routes — /login, (protected)/*, api/*
src/lib/         db, auth, data-access, validation
src/hooks/       TanStack Query hooks
src/stores/      Zustand stores
src/context/     AuthContext
src/components/  ui, tasks, assignees, dashboard, layout
src/types/       shared types
```

Prisma is only called from `src/lib/data/`.
