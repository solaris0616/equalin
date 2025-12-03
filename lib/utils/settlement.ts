/**
 * Settlement calculation utilities for bill splitting.
 * Implements algorithms to calculate member balances and generate
 * minimal settlement transactions.
 */

export interface MemberBalance {
  profile_id: string;
  name: string;
  paid: number; // total amount paid (in cents)
  owed: number; // total share of expenses (in cents)
  balance: number; // paid - owed (in cents)
}

export interface SettlementTransaction {
  from: string; // profile name
  to: string; // profile name
  amount: number; // amount in cents
}

export interface PaymentWithParticipants {
  id: string;
  payer_id: string;
  amount: number; // in cents
  participant_ids: string[];
}

export interface Member {
  id: string;
  name: string;
}

/**
 * Calculates the total amount paid by each member.
 *
 * @param payments - Array of payments with participant information
 * @param members - Array of all group members
 * @returns Map of profile_id to total amount paid (in cents)
 */
export function calculateTotalPaid(
  payments: PaymentWithParticipants[],
  members: Member[],
): Map<string, number> {
  const totalPaid = new Map<string, number>();

  // Initialize all members with 0
  for (const member of members) {
    totalPaid.set(member.id, 0);
  }

  // Sum up payments by payer
  for (const payment of payments) {
    const currentTotal = totalPaid.get(payment.payer_id) || 0;
    totalPaid.set(payment.payer_id, currentTotal + payment.amount);
  }

  return totalPaid;
}

/**
 * Calculates the total amount owed by each member based on their participation.
 * Each participant owes an equal share of the payments they participated in.
 *
 * @param payments - Array of payments with participant information
 * @param members - Array of all group members
 * @returns Map of profile_id to total amount owed (in cents)
 */
export function calculateTotalOwed(
  payments: PaymentWithParticipants[],
  members: Member[],
): Map<string, number> {
  const totalOwed = new Map<string, number>();

  // Initialize all members with 0
  for (const member of members) {
    totalOwed.set(member.id, 0);
  }

  // Calculate share for each payment
  for (const payment of payments) {
    const participantCount = payment.participant_ids.length;
    if (participantCount === 0) continue;

    const sharePerPerson = payment.amount / participantCount;

    for (const participantId of payment.participant_ids) {
      const currentOwed = totalOwed.get(participantId) || 0;
      totalOwed.set(participantId, currentOwed + sharePerPerson);
    }
  }

  return totalOwed;
}

/**
 * Computes the balance for each member (amount paid - amount owed).
 * Positive balance means the member should receive money.
 * Negative balance means the member should pay money.
 *
 * @param payments - Array of payments with participant information
 * @param members - Array of all group members
 * @returns Array of member balances
 */
export function calculateMemberBalances(
  payments: PaymentWithParticipants[],
  members: Member[],
): MemberBalance[] {
  const totalPaid = calculateTotalPaid(payments, members);
  const totalOwed = calculateTotalOwed(payments, members);

  const balances: MemberBalance[] = [];

  for (const member of members) {
    const paid = totalPaid.get(member.id) || 0;
    const owed = totalOwed.get(member.id) || 0;
    const balance = paid - owed;

    balances.push({
      profile_id: member.id,
      name: member.name,
      paid,
      owed,
      balance,
    });
  }

  return balances;
}

/**
 * Generates minimal settlement transactions using a greedy algorithm.
 * The algorithm matches the largest debtor with the largest creditor
 * repeatedly until all balances are settled.
 *
 * @param balances - Array of member balances
 * @returns Array of settlement transactions showing who should pay whom
 */
export function generateSettlementTransactions(
  balances: MemberBalance[],
): SettlementTransaction[] {
  // Create mutable copies of balances
  const creditors = balances
    .filter((b) => b.balance > 0.01) // Use small epsilon for floating point comparison
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = balances
    .filter((b) => b.balance < -0.01) // Use small epsilon for floating point comparison
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balance - b.balance);

  const transactions: SettlementTransaction[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Calculate the amount to transfer (minimum of what creditor is owed and what debtor owes)
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    // Round to nearest cent to avoid floating point issues
    const roundedAmount = Math.round(amount);

    if (roundedAmount > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: roundedAmount,
      });
    }

    // Update balances
    creditor.balance -= amount;
    debtor.balance += amount;

    // Move to next creditor/debtor if current one is settled
    if (Math.abs(creditor.balance) < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return transactions;
}

/**
 * Main function to calculate settlement for a group.
 * Combines balance calculation and transaction generation.
 *
 * @param payments - Array of payments with participant information
 * @param members - Array of all group members
 * @returns Array of settlement transactions
 */
export function calculateSettlement(
  payments: PaymentWithParticipants[],
  members: Member[],
): SettlementTransaction[] {
  const balances = calculateMemberBalances(payments, members);
  return generateSettlementTransactions(balances);
}
