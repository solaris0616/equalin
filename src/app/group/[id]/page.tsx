import { getGroupDashboardData } from "@/app/actions/payments";
import GroupClientPage from "./GroupClientPage";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const initialData = await getGroupDashboardData(groupId);

  return <GroupClientPage groupId={groupId} initialData={initialData} />;
}
