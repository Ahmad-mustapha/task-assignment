import { notFound } from "next/navigation";

import { getTaskById } from "@/lib/data/tasks";
import { getAssignees } from "@/lib/data/assignees";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [task, assignees] = await Promise.all([
    getTaskById(id),
    getAssignees(),
  ]);

  // Renders the framework 404 rather than an empty shell.
  if (!task) notFound();

  return <TaskDetailView task={task} assignees={assignees} />;
}
