import type {
  Payment,
  PaymentWithDetails,
  PaymentWithParticipants,
} from "@/core/domain/entities/payment";
import type { IPaymentRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

type PaymentRow = {
  id: string;
  group_id: string;
  payer_member_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  payer: { name: string };
  participants: { member_id: string; member: { name: string } }[];
};

export class SupabasePaymentRepository implements IPaymentRepository {
  async create(
    payment: Omit<Payment, "id" | "createdAt">,
    participantMemberIds: string[]
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc("save_payment", {
      p_group_id: payment.groupId,
      p_payment_id: null,
      p_payer_id: payment.payerMemberId,
      p_amount: payment.amount,
      p_description: payment.description,
      p_participant_ids: participantMemberIds,
    });
    if (error) throw new Error(error.message);
  }

  async update(
    groupId: string,
    paymentId: string,
    payment: Omit<Payment, "id" | "groupId" | "createdAt">,
    participantMemberIds: string[]
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_payment", {
      p_group_id: groupId,
      p_payment_id: paymentId,
      p_payer_id: payment.payerMemberId,
      p_amount: payment.amount,
      p_description: payment.description,
      p_participant_ids: participantMemberIds,
    });
    if (error) throw new Error(error.message);
  }

  async getByIdWithParticipants(
    paymentId: string
  ): Promise<PaymentWithParticipants | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id,
        payer_member_id,
        amount,
        participants:payment_participants(member_id)
      `
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      payerMemberId: data.payer_member_id,
      amount: data.amount,
      participantMemberIds:
        (data.participants as unknown as { member_id: string }[])?.map(
          (pr) => pr.member_id
        ) || [],
    };
  }

  async getByGroupId(groupId: string): Promise<PaymentWithDetails[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_group_payments", {
      p_group_id: groupId,
    });

    if (error) throw new Error(error.message);

    if (!Array.isArray(data)) throw new Error("Invalid payment response");
    return (data as PaymentRow[]).map((p) => ({
      id: p.id,
      groupId: p.group_id,
      payerMemberId: p.payer_member_id,
      amount: p.amount,
      description: p.description,
      createdAt: p.created_at,
      payerName: p.payer?.name || "Unknown",
      participantNames:
        p.participants?.map((pr) => pr.member?.name || "Unknown") || [],
      participantMemberIds: p.participants?.map((pr) => pr.member_id) || [],
    }));
  }

  async getWithParticipantsByGroupId(
    groupId: string
  ): Promise<PaymentWithParticipants[]> {
    return this.getByGroupId(groupId);
  }

  async delete(groupId: string, paymentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_group_payment", {
      p_group_id: groupId,
      p_payment_id: paymentId,
    });

    if (error) throw new Error(error.message);
  }
}
