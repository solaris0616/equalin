import { describe, expect, it } from "bun:test";

import { SettlementService } from "./SettlementService";

const members = ["a", "b", "c", "d"].map((id) => ({
  id,
  name: id,
  groupId: "g",
}));
describe("integer settlement invariants", () => {
  it("conserves every yen and settles every member across uneven splits", () => {
    for (let amount = 1; amount <= 101; amount++) {
      const payments = members.map((member, i) => ({
        id: member.id,
        payerMemberId: member.id,
        amount: amount + i,
        participantMemberIds: members.slice(0, i + 1).map((m) => m.id),
      }));
      const balances = SettlementService.calculateBalances(payments, members);
      expect(balances.reduce((sum, b) => sum + b.balance, 0)).toBe(0);
      const remaining = new Map(balances.map((b) => [b.memberId, b.balance]));
      for (const tx of SettlementService.generateTransactions(balances)) {
        expect(Number.isSafeInteger(tx.amount)).toBe(true);
        remaining.set(tx.fromId, remaining.get(tx.fromId)! + tx.amount);
        remaining.set(tx.toId, remaining.get(tx.toId)! - tx.amount);
      }
      expect([...remaining.values()]).toEqual([0, 0, 0, 0]);
      expect(
        SettlementService.calculateBalances(
          payments.map((p) => ({
            ...p,
            participantMemberIds: [...p.participantMemberIds].reverse(),
          })),
          members
        )
      ).toEqual(balances);
    }
  });

  it("rejects duplicate participants and unsafe totals", () => {
    const payment = {
      id: "p",
      payerMemberId: "a",
      amount: 10,
      participantMemberIds: ["b", "b"],
    };
    expect(() =>
      SettlementService.calculateBalances([payment], members)
    ).toThrow();
    expect(() =>
      SettlementService.calculateBalances(
        [
          {
            ...payment,
            amount: Number.MAX_SAFE_INTEGER,
            participantMemberIds: ["a"],
          },
          { ...payment, participantMemberIds: ["a"] },
        ],
        members
      )
    ).toThrow();
  });
});
