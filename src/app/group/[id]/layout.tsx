import type { Metadata } from "next";

import { groupRepository } from "@/core/registry";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const group = await groupRepository.getById(id);

  if (!group) {
    return {
      title: "グループ - パリカン",
    };
  }

  return {
    title: `${group.name} - パリカン`,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
