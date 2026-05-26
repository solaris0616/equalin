import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase.from("groups").select("name").eq("id", id).single();

  if (!group) {
    return {
      title: "グループ - パリカン",
    };
  }

  return {
    title: `${group.name} - パリカン`,
  };
}

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
