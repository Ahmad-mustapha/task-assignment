import { getTasks } from "@/lib/data/tasks";
import { getAssignees } from "@/lib/data/assignees";
import { TaskQuerySchema } from "@/lib/validation/task.schema";
import { TasksView } from "@/components/tasks/TasksView";

/**
 * Server component: renders the unfiltered first page so the list is visible
 * immediately. TanStack Query takes over from there as filters change.
 */
export default async function TasksPage() {
  const defaults = TaskQuerySchema.parse({});

  const [initialTasks, assignees] = await Promise.all([
    getTasks(defaults),
    getAssignees(),
  ]);

  return <TasksView initialTasks={initialTasks} assignees={assignees} />;
}
