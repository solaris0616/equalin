import { nanoid } from "nanoid";

import type { Group, Member } from "@/core/domain/entities/payment";
import type { IGroupRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

type GroupRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  is_rough_mode: boolean;
};
type MemberRow = { id: string; group_id: string; name: string };

export class SupabaseGroupRepository implements IGroupRepository {
  async create(
    name: string,
    _ownerId: string,
    memberNames: string[]
  ): Promise<Group> {
    const id = nanoid();
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("create_group", {
        p_id: id,
        p_name: name,
        p_member_names: memberNames,
      })
      .single<GroupRow>();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      isRoughMode: data.is_rough_mode,
    };
  }

  async getById(id: string): Promise<Group | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_group_by_link", { p_group_id: id })
      .maybeSingle<GroupRow>();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      isRoughMode: data.is_rough_mode,
    };
  }

  async addMember(groupId: string, name: string): Promise<Member> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("add_group_member", { p_group_id: groupId, p_name: name })
      .single<MemberRow>();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      groupId: data.group_id,
      name: data.name,
    };
  }

  async deleteMember(groupId: string, memberId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_group_member", {
      p_group_id: groupId,
      p_member_id: memberId,
    });

    if (error) throw new Error(error.message);
  }

  async getMembers(groupId: string): Promise<Member[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((m) => ({
      id: m.id,
      groupId: m.group_id,
      name: m.name,
    }));
  }

  async addCollaborator(groupId: string, _userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("join_group", { p_group_id: groupId });

    if (error) throw new Error(error.message);
  }

  async isCollaborator(groupId: string, userId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("group_collaborators")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data;
  }

  async updateRoughMode(groupId: string, isRoughMode: boolean): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_rough_mode", {
      p_group_id: groupId,
      p_enabled: isRoughMode,
    });

    if (error) throw new Error(error.message);
  }
}
