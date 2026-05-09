import type {
  Member,
  Payment,
  PaymentWithDetails,
  PaymentWithParticipants,
} from "@/core/domain/entities/payment";
import type { IPaymentRepository } from "@/core/domain/repositories";
import { createClient } from "@/lib/supabase/server";

export class SupabasePaymentRepository implements IPaymentRepository {
  async create(
    payment: Omit<Payment, "id" | "createdAt">,
    participantMemberIds: string[],
  ): Promise<void> {
    const supabase = await createClient();

    // Insert payment
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        group_id: payment.groupId,
        payer_member_id: payment.payerMemberId,
        amount: payment.amount,
        description: payment.description,
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // Insert participants
    const participantRecords = participantMemberIds.map((memberId) => ({
      payment_id: paymentData.id,
      member_id: memberId,
    }));

    const { error: participantsError } = await supabase
      .from("payment_participants")
      .insert(participantRecords);

    if (participantsError) {
      // Rollback
      await supabase.from("payments").delete().eq("id", paymentData.id);
      throw new Error(participantsError.message);
    }
  }

  async update(
    paymentId: string,
    payment: Partial<Omit<Payment, "id" | "groupId" | "createdAt">>,
    participantMemberIds: string[],
  ): Promise<void> {
    const supabase = await createClient();

    // 1. Update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        payer_member_id: payment.payerMemberId,
        amount: payment.amount,
        description: payment.description,
      })
      .eq("id", paymentId);

    if (paymentError) throw new Error(paymentError.message);

    // 2. Update participants (delete and insert)
    const { error: deleteError } = await supabase
      .from("payment_participants")
      .delete()
      .eq("payment_id", paymentId);

    if (deleteError) throw new Error(deleteError.message);

    const participantRecords = participantMemberIds.map((memberId) => ({
      payment_id: paymentId,
      member_id: memberId,
    }));

    const { error: upsertError } = await supabase
      .from("payment_participants")
      .insert(participantRecords);

    if (upsertError) throw new Error(upsertError.message);
  }

  async getByIdWithParticipants(paymentId: string): Promise<PaymentWithParticipants | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id,
        payer_member_id,
        amount,
        participants:payment_participants(member_id)
      `,
      )
      .eq("id", paymentId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      payerMemberId: data.payer_member_id,
      amount: data.amount,
      participantMemberIds:
        (data.participants as unknown as { member_id: string }[])?.map((pr) => pr.member_id) || [],
    };
  }

  async getByGroupId(groupId: string): Promise<PaymentWithDetails[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        payer:members!payer_member_id(id, name),
        participants:payment_participants(
          member:members(id, name)
        )
      `,
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((p) => ({
      id: p.id,
      groupId: p.group_id,
      payerMemberId: p.payer_member_id,
      amount: p.amount,
      description: p.description,
      createdAt: p.created_at,
      payerName: (p.payer as unknown as Member)?.name || "Unknown",
      participantNames:
        (
          p.participants as unknown as {
            member: Member | null;
          }[]
        )?.map((pr) => pr.member?.name || "Unknown") || [],
    }));
  }

  async getWithParticipantsByGroupId(groupId: string): Promise<PaymentWithParticipants[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id,
        payer_member_id,
        amount,
        participants:payment_participants(member_id)
      `,
      )
      .eq("group_id", groupId);

    if (error) throw new Error(error.message);

    return (data || []).map((p) => ({
      id: p.id,
      payerMemberId: p.payer_member_id,
      amount: p.amount,
      participantMemberIds:
        (p.participants as unknown as { member_id: string }[])?.map((pr) => pr.member_id) || [],
    }));
  }

  async delete(paymentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);

    if (error) throw new Error(error.message);
  }
}
