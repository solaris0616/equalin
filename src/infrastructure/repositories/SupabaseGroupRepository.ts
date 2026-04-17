import { createClient } from '@/lib/supabase/server';
import type { Group, Profile } from '@/domain/entities/payment';
import type { IGroupRepository } from '@/domain/repositories';

export class SupabaseGroupRepository implements IGroupRepository {
  async create(): Promise<Group> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('groups')
      .insert([{}])
      .select('id, created_at')
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      createdAt: data.created_at,
    };
  }

  async getById(id: string): Promise<Group | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
    };
  }

  async addMember(groupId: string, profileId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, profile_id: profileId });

    if (error) throw new Error(error.message);
  }

  async getMembers(groupId: string): Promise<Profile[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('group_members')
      .select('profile:profiles(id, name)')
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
    return (data || [])
      .map((m: any) => m.profile)
      .filter((p: any) => p !== null);
  }
}
