import { getAssignees } from "@/lib/data/assignees";
import { AssigneesView } from "@/components/assignees/AssigneesView";

export default async function AssigneesPage() {
  const assignees = await getAssignees();

  return <AssigneesView initialAssignees={assignees} />;
}
