'use server';

import { createClient } from '@/lib/supabase/server';
import { amountToInteger, isValidAmount } from '@/lib/utils/currency';

/**
 * Type definitions for payment operations
 */

export interface Profile {
  id: string;
  name: string;
}

export interface Payment {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number; // stored as integer (cents)
  description: string | null;
  created_at: string;
}

export interface PaymentWithDetails extends Payment {
  payer_name: string;
  participant_names: string[];
}

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
      return { success: false, error: 'Please select at least one participant' };
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
      return { success: false, error: 'Failed to create payment. Please try again.' };
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
      return { success: false, error: 'Failed to add participants. Please try again.' };
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
export async function getGroupPayments(groupId: string): Promise<PaymentWithDetails[]> {
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
    const paymentsWithDetails: PaymentWithDetails[] = payments.map((payment) => ({
      id: payment.id,
      group_id: payment.group_id,
      payer_id: payment.payer_id,
      amount: payment.amount,
      description: payment.description,
      created_at: payment.created_at,
      payer_name: payment.payer?.name || 'Unknown',
      participant_names: payment.participants?.map((p: any) => p.profile?.name || 'Unknown') || [],
    }));

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
