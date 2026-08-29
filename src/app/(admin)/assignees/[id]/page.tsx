import { notFound } from "next/navigation";

import { getAssigneeById, getTasksByAssignee } from "@/lib/data/assignees";
import { AssigneeDetailView } from "@/components/assignees/AssigneeDetailView";

export default async function AssigneeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assignee = await getAssigneeById(id);
  if (!assignee) notFound();

  const tasks = await getTasksByAssignee(id);

  return <AssigneeDetailView assignee={assignee} tasks={tasks} />;
}
