import type {
  Member,
  MemberBalance,
  PaymentWithParticipants,
  SettlementTransaction,
} from "../entities/payment";

export class SettlementService {
  /**
   * メンバーごとの支払い合計を計算
   */
  private static calculateTotalPaid(
    payments: PaymentWithParticipants[],
    members: Member[]
  ): Map<string, number> {
    const totalPaid = new Map<string, number>();
    for (const member of members) {
      totalPaid.set(member.id, 0);
    }
    for (const payment of payments) {
      const current = totalPaid.get(payment.payerMemberId) || 0;
      totalPaid.set(payment.payerMemberId, current + payment.amount);
    }
    return totalPaid;
  }

  /**
   * メンバーごとの負担額合計を計算
   */
  private static calculateTotalOwed(
    payments: PaymentWithParticipants[],
    members: Member[]
  ): Map<string, number> {
    const totalOwed = new Map<string, number>();
    for (const member of members) {
      totalOwed.set(member.id, 0);
    }
    for (const payment of payments) {
      // Assign whole yen; stable IDs make allocation independent of DB row order.
      const participants = [...payment.participantMemberIds].sort();
      const share = Math.floor(payment.amount / participants.length);
      const remainder = payment.amount % participants.length;
      participants.forEach((id, index) => {
        totalOwed.set(
          id,
          (totalOwed.get(id) || 0) + share + (index < remainder ? 1 : 0)
        );
      });
    }
    return totalOwed;
  }

  /**
   * 全メンバーの残高（支払い - 負担）を計算
   */
  public static calculateBalances(
    payments: PaymentWithParticipants[],
    members: Member[]
  ): MemberBalance[] {
    const memberIds = new Set(members.map((member) => member.id));
    if (memberIds.size !== members.length) throw new Error("Duplicate member");
    let total = 0;
    for (const payment of payments) {
      if (
        !Number.isSafeInteger(payment.amount) ||
        payment.amount <= 0 ||
        !memberIds.has(payment.payerMemberId) ||
        payment.participantMemberIds.length === 0 ||
        new Set(payment.participantMemberIds).size !==
          payment.participantMemberIds.length ||
        payment.participantMemberIds.some((id) => !memberIds.has(id))
      ) {
        throw new Error(
          "Invalid payment data; settlement cannot be calculated"
        );
      }
      total += payment.amount;
      if (!Number.isSafeInteger(total))
        throw new Error("Settlement total exceeds safe integer range");
    }
    const paidMap = SettlementService.calculateTotalPaid(payments, members);
    const owedMap = SettlementService.calculateTotalOwed(payments, members);

    return members.map((member) => {
      const paid = paidMap.get(member.id) || 0;
      const owed = owedMap.get(member.id) || 0;
      return {
        memberId: member.id,
        name: member.name,
        paid,
        owed,
        balance: paid - owed,
      };
    });
  }

  /**
   * 貪欲法で精算を生成（取引数の最適解は保証しない）
   */
  public static generateTransactions(
    balances: MemberBalance[],
    isRoughMode?: boolean
  ): SettlementTransaction[] {
    if (
      balances.some((b) => !Number.isSafeInteger(b.balance)) ||
      balances.reduce((sum, b) => sum + b.balance, 0) !== 0
    ) {
      throw new Error("Balances must be whole yen and sum to zero");
    }
    const creditors = balances
      .filter((b) => b.balance > 0)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = balances
      .filter((b) => b.balance < 0)
      .map((b) => ({ ...b }))
      .sort((a, b) => a.balance - b.balance);

    const transactions: SettlementTransaction[] = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      const roundedAmount = isRoughMode
        ? Math.round(amount / 1000) * 1000
        : amount;

      if (roundedAmount > 0) {
        transactions.push({
          fromId: debtor.memberId,
          fromName: debtor.name,
          toId: creditor.memberId,
          toName: creditor.name,
          amount: roundedAmount,
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

    return transactions;
  }
}
