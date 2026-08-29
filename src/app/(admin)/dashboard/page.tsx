import { getDashboardStats, getTasks } from "@/lib/data/tasks";
import { getAssignees } from "@/lib/data/assignees";
import { TaskQuerySchema } from "@/lib/validation/task.schema";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { DASHBOARD_TASK_QUERY } from "@/lib/query-keys";

/**
 * Server component: reads the data layer directly, so the dashboard arrives
 * fully rendered with no client fetch or loading flash.
 */
export default async function DashboardPage() {
  // Same filters the client hook uses, so its query is seeded rather than
  // refetched on mount.
  const taskQuery = TaskQuerySchema.parse(DASHBOARD_TASK_QUERY);

  const [stats, tasks, assignees] = await Promise.all([
    getDashboardStats(),
    getTasks(taskQuery),
    getAssignees(),
  ]);

  return (
    <DashboardView stats={stats} tasks={tasks} assignees={assignees} />
  );
}
