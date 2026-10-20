import type { Payment } from "@/core/domain/entities/payment";
import type { IPaymentRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

export class SupabasePaymentRepository implements IPaymentRepository {
  async create(
    payment: Omit<Payment, "id" | "createdAt">,
    participantMemberIds: string[],
    clientRequestId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc("save_payment", {
      p_group_id: payment.groupId,
      p_payment_id: null,
      p_payer_id: payment.payerMemberId,
      p_amount: payment.amount,
      p_description: payment.description,
      p_participant_ids: participantMemberIds,
      p_client_request_id: clientRequestId,
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
      p_client_request_id: null,
    });
    if (error) throw new Error(error.message);
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
