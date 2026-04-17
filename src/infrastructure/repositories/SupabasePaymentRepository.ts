import { createClient } from '@/lib/supabase/server';
import type {
  Payment,
  PaymentWithDetails,
  PaymentWithParticipants,
} from '@/domain/entities/payment';
import type { IPaymentRepository } from '@/domain/repositories';

export class SupabasePaymentRepository implements IPaymentRepository {
  async create(
    payment: Omit<Payment, 'id' | 'createdAt'>,
    participantIds: string[],
  ): Promise<void> {
    const supabase = await createClient();

    // Insert payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        group_id: payment.groupId,
        payer_id: payment.payerId,
        amount: payment.amount,
        description: payment.description,
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // Insert participants
    const participantRecords = participantIds.map((profileId) => ({
      payment_id: paymentData.id,
      profile_id: profileId,
    }));

    const { error: participantsError } = await supabase
      .from('payment_participants')
      .insert(participantRecords);

    if (participantsError) {
      // Rollback
      await supabase.from('payments').delete().eq('id', paymentData.id);
      throw new Error(participantsError.message);
    }
  }

  async getByGroupId(groupId: string): Promise<PaymentWithDetails[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        payer:profiles!payer_id(id, name),
        participants:payment_participants(
          profile:profiles(id, name)
        )
      `,
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((p: any) => ({
      id: p.id,
      groupId: p.group_id,
      payerId: p.payer_id,
      amount: p.amount,
      description: p.description,
      createdAt: p.created_at,
      payerName: p.payer?.name || 'Unknown',
      participantNames:
        p.participants?.map((pr: any) => pr.profile?.name || 'Unknown') || [],
    }));
  }

  async getWithParticipantsByGroupId(
    groupId: string,
  ): Promise<PaymentWithParticipants[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        id,
        payer_id,
        amount,
        participants:payment_participants(profile_id)
      `,
      )
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);

    return (data || []).map((p: any) => ({
      id: p.id,
      payerId: p.payer_id,
      amount: p.amount,
      participantIds: p.participants?.map((pr: any) => pr.profile_id) || [],
    }));
  }

  async delete(paymentId: string, groupId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
  }
}
