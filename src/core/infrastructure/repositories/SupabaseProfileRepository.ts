import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/core/domain/entities/payment';
import type { IProfileRepository } from '@/core/domain/repositories';

export class SupabaseProfileRepository implements IProfileRepository {
  async create(profile: Profile): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').upsert(profile);

    if (error) throw new Error(error.message);
  }

  async getById(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }
}
