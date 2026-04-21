import type {
  MemberBalance,
  PaymentWithParticipants,
  Profile,
  SettlementTransaction,
} from '../entities/payment';

export class SettlementService {
  /**
   * メンバーごとの支払い合計を計算
   */
  private static calculateTotalPaid(
    payments: PaymentWithParticipants[],
    members: Profile[],
  ): Map<string, number> {
    const totalPaid = new Map<string, number>();
    for (const member of members) {
      totalPaid.set(member.id, 0);
    }
    for (const payment of payments) {
      const current = totalPaid.get(payment.payerId) || 0;
      totalPaid.set(payment.payerId, current + payment.amount);
    }
    return totalPaid;
  }

  /**
   * メンバーごとの負担額合計を計算
   */
  private static calculateTotalOwed(
    payments: PaymentWithParticipants[],
    members: Profile[],
  ): Map<string, number> {
    const totalOwed = new Map<string, number>();
    for (const member of members) {
      totalOwed.set(member.id, 0);
    }
    for (const payment of payments) {
      const count = payment.participantIds.length;
      if (count === 0) continue;
      const share = payment.amount / count;
      for (const participantId of payment.participantIds) {
        const current = totalOwed.get(participantId) || 0;
        totalOwed.set(participantId, current + share);
      }
    }
    return totalOwed;
  }

  /**
   * 全メンバーの残高（支払い - 負担）を計算
   */
  public static calculateBalances(
    payments: PaymentWithParticipants[],
    members: Profile[],
  ): MemberBalance[] {
    const paidMap = SettlementService.calculateTotalPaid(payments, members);
    const owedMap = SettlementService.calculateTotalOwed(payments, members);

    return members.map((member) => {
      const paid = paidMap.get(member.id) || 0;
      const owed = owedMap.get(member.id) || 0;
      return {
        profileId: member.id,
        name: member.name,
        paid,
        owed,
        balance: paid - owed,
      };
    });
  }

  /**
   * 最小の取引で精算を行うトランザクションを生成
   */
  public static generateTransactions(
    balances: MemberBalance[],
  ): SettlementTransaction[] {
    const creditors = balances
      .filter((b) => b.balance > 0.01)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = balances
      .filter((b) => b.balance < -0.01)
      .map((b) => ({ ...b }))
      .sort((a, b) => a.balance - b.balance);

    const transactions: SettlementTransaction[] = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      const roundedAmount = Math.round(amount);

      if (roundedAmount > 0) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: roundedAmount,
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (Math.abs(creditor.balance) < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    return transactions;
  }
}
