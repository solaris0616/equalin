'use server';

import { createClient } from '@/lib/supabase/server';
import { amountToInteger, isValidAmount } from '@/lib/utils/currency';
import {
  calculateSettlement as calculateSettlementUtil,
  type Member,
  type PaymentWithParticipants,
} from '@/lib/utils/settlement';
import type {
  Profile,
  Payment,
  PaymentWithDetails,
  SettlementTransaction,
} from '@/types/payment';

// Re-export types for backward compatibility
export type { Profile, Payment, PaymentWithDetails, SettlementTransaction };

/**
 * Creates a new payment with participants.
 *
 * @param groupId - The ID of the group
 * @param payerId - The ID of the user making the payment
 * @param amount - The payment amount in decimal format (e.g., 100.50)
 * @param description - Optional description of the payment
 * @param participantIds - Array of profile IDs who share this expense
 * @returns Object with success status and optional error message
 */
export async function createPayment(
  groupId: string,
  payerId: string,
  amount: number,
  description: string,
  participantIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate inputs
    if (participantIds.length === 0) {
      return {
        success: false,
        error: 'Please select at least one participant',
      };
    }

    if (!isValidAmount(amount)) {
      return {
        success: false,
        error: 'Amount must be greater than zero and not exceed 999,999,999.99',
      };
    }

    const supabase = await createClient();

    // Convert amount to integer cents for storage
    const amountInCents = amountToInteger(amount);

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        group_id: groupId,
        payer_id: payerId,
        amount: amountInCents,
        description: description || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment:', {
        groupId,
        payerId,
        error: paymentError.message,
      });
      return {
        success: false,
        error: 'Failed to create payment. Please try again.',
      };
    }

    // Insert participants
    const participantRecords = participantIds.map((profileId) => ({
      payment_id: payment.id,
      profile_id: profileId,
    }));

    const { error: participantsError } = await supabase
      .from('payment_participants')
      .insert(participantRecords);

    if (participantsError) {
      // Rollback: delete the payment
      await supabase.from('payments').delete().eq('id', payment.id);
      console.error('Failed to add participants:', {
        paymentId: payment.id,
        error: participantsError.message,
      });
      return {
        success: false,
        error: 'Failed to add participants. Please try again.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating payment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetches all payments for a group with payer and participant details.
 *
 * @param groupId - The ID of the group
 * @returns Array of payments with payer name and participant names
 */
export async function getGroupPayments(
  groupId: string,
): Promise<PaymentWithDetails[]> {
  try {
    const supabase = await createClient();

    // Fetch payments with payer information and participants
    const { data: payments, error: paymentsError } = await supabase
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

    if (paymentsError) {
      console.error('Failed to fetch payments:', {
        groupId,
        error: paymentsError.message,
      });
      return [];
    }

    if (!payments) {
      return [];
    }

    // Transform the data to match PaymentWithDetails interface
    const paymentsWithDetails: PaymentWithDetails[] = payments.map(
      (payment) => ({
        id: payment.id,
        group_id: payment.group_id,
        payer_id: payment.payer_id,
        amount: payment.amount,
        description: payment.description,
        created_at: payment.created_at,
        payer_name: payment.payer?.name || 'Unknown',
        participant_names:
          payment.participants?.map((p: any) => p.profile?.name || 'Unknown') ||
          [],
      }),
    );

    return paymentsWithDetails;
  } catch (error) {
    console.error('Unexpected error fetching payments:', error);
    return [];
  }
}

/**
 * Fetches all members of a group.
 *
 * @param groupId - The ID of the group
 * @returns Array of profiles (members) in the group
 */
export async function getGroupMembers(groupId: string): Promise<Profile[]> {
  try {
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from('group_members')
      .select('profile:profiles(id, name)')
      .eq('group_id', groupId);

    if (error) {
      console.error('Failed to fetch group members:', {
        groupId,
        error: error.message,
      });
      return [];
    }

    if (!members) {
      return [];
    }

    // Extract profiles from the nested structure
    const profiles: Profile[] = members
      .map((member: any) => member.profile)
      .filter((profile: any) => profile !== null);

    return profiles;
  } catch (error) {
    console.error('Unexpected error fetching group members:', error);
    return [];
  }
}

/**
 * Calculates settlement transactions for a group.
 * Determines who should pay whom to settle all debts fairly.
 *
 * @param groupId - The ID of the group
 * @returns Array of settlement transactions showing who pays whom and how much
 */
export async function calculateSettlement(
  groupId: string,
): Promise<SettlementTransaction[]> {
  try {
    const supabase = await createClient();

    // Fetch all payments with participants for the group
    const { data: payments, error: paymentsError } = await supabase
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

    if (paymentsError) {
      console.error('Failed to fetch payments for settlement:', {
        groupId,
        error: paymentsError.message,
      });
      return [];
    }

    if (!payments || payments.length === 0) {
      return [];
    }

    // Fetch all group members
    const { data: memberData, error: membersError } = await supabase
      .from('group_members')
      .select('profile:profiles(id, name)')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Failed to fetch members for settlement:', {
        groupId,
        error: membersError.message,
      });
      return [];
    }

    if (!memberData) {
      return [];
    }

    // Transform data to match settlement utility function interfaces
    const paymentsWithParticipants: PaymentWithParticipants[] = payments.map(
      (payment) => ({
        id: payment.id,
        payer_id: payment.payer_id,
        amount: payment.amount,
        participant_ids:
          payment.participants?.map(
            (p: { profile_id: string }) => p.profile_id,
          ) || [],
      }),
    );

    // Extract profiles from the nested structure (same as getGroupMembers)
    const members: Member[] = memberData
      .map(
        (member) => (member as unknown as { profile: Profile | null }).profile,
      )
      .filter((profile): profile is Profile => profile !== null)
      .map((profile) => ({
        id: profile.id,
        name: profile.name,
      }));

    // Calculate settlement using utility function
    const transactions = calculateSettlementUtil(
      paymentsWithParticipants,
      members,
    );

    return transactions;
  } catch (error) {
    console.error('Unexpected error calculating settlement:', error);
    return [];
  }
}
