import type { TaskWithAssignee } from "@/types";

export type TrendPoint = {
  date: string;
  created: number;
  completed: number;
};

/**
 * Buckets tasks into per-day created/completed counts.
 *
 * Derived from the task list the page already has rather than a dedicated
 * endpoint — the dataset is small, and an extra API route for a chart the
 * brief lists as a bonus would not earn its keep.
 */
export function buildTrends(
  tasks: TaskWithAssignee[],
  days: number
): TrendPoint[] {
  const buckets = new Map<string, { created: number; completed: number }>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    buckets.set(toKey(date), { created: 0, completed: 0 });
  }

  for (const task of tasks) {
    const createdKey = toKey(new Date(task.createdAt));
    const createdBucket = buckets.get(createdKey);
    if (createdBucket) createdBucket.created += 1;

    // updatedAt is the closest signal we have for when a task finished.
    if (task.status === "COMPLETED") {
      const completedKey = toKey(new Date(task.updatedAt));
      const completedBucket = buckets.get(completedKey);
      if (completedBucket) completedBucket.completed += 1;
    }
  }

  return Array.from(buckets.entries()).map(([key, counts]) => ({
    date: new Date(key).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    ...counts,
  }));
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
