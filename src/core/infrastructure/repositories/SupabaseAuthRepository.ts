import type { IAuthRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

export class SupabaseAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id };
  }

  async signInAnonymously(): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error("Anonymous sign in failed");
    return { id: data.user.id };
  }
}
