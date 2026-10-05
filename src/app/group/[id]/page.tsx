import { notFound } from "next/navigation";

import { getGroupDashboardData } from "@/app/actions/payments";

import GroupClientPage from "./GroupClientPage";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const initialData = await getGroupDashboardData(groupId);

  if (initialData.error) throw new Error(initialData.error);
  if (!initialData.group) notFound();

  return (
    <GroupClientPage
      key={groupId}
      groupId={groupId}
      initialData={initialData}
    />
  );
}
