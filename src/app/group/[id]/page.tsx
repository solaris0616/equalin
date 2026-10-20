import { notFound } from "next/navigation";

import { getGroupDashboardData } from "@/app/actions/payments";

import GroupClientPage from "./GroupClientPage";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { id: groupId } = await params;
  const { invite } = await searchParams;
  const initialData = await getGroupDashboardData(groupId);

  if (initialData.error) throw new Error(initialData.error);
  if (!initialData.group) notFound();

  return (
    <GroupClientPage
      key={groupId}
      groupId={groupId}
      initialData={initialData}
      invitationToken={isInvitationToken(invite) ? invite : null}
    />
  );
}

function isInvitationToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}
