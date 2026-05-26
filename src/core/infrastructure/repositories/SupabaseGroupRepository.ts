import { nanoid } from "nanoid";

import type { Group, Member } from "@/core/domain/entities/payment";
import type { IGroupRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

export class SupabaseGroupRepository implements IGroupRepository {
  async create(name: string, ownerId: string): Promise<Group> {
    const id = nanoid();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("groups")
      .insert([{ id, name, owner_id: ownerId }])
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Also add owner as a collaborator
    await this.addCollaborator(id, ownerId);

    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
    };
  }

  async getById(id: string): Promise<Group | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
    };
  }

  async addMember(groupId: string, name: string): Promise<Member> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .insert({ group_id: groupId, name })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      groupId: data.group_id,
      name: data.name,
    };
  }

  async deleteMember(memberId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

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

  async addCollaborator(groupId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("group_collaborators")
      .upsert({ group_id: groupId, user_id: userId });

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

    if (error) return false;
    return !!data;
  }
}
