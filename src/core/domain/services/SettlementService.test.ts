import { describe, expect, it } from "bun:test";

import type { Member, PaymentWithParticipants } from "../entities/payment";

import { SettlementService } from "./SettlementService";

describe("SettlementService", () => {
  const members: Member[] = [
    { id: "1", groupId: "g1", name: "Alice" },
    { id: "2", groupId: "g1", name: "Bob" },
    { id: "3", groupId: "g1", name: "Charlie" },
  ];

  describe("calculateBalances", () => {
    it("should calculate correct balances", () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: "p1",
          payerMemberId: "1",
          amount: 3000,
          participantMemberIds: ["1", "2", "3"],
        },
        {
          id: "p2",
          payerMemberId: "2",
          amount: 6000,
          participantMemberIds: ["1", "2", "3"],
        },
      ];

      const balances = SettlementService.calculateBalances(payments, members);

      // Alice paid 3000, owes 3000 (9000/3) = 0
      expect(balances.find((b) => b.memberId === "1")?.balance).toBe(0);
      // Bob paid 6000, owes 3000 (9000/3) = +3000
      expect(balances.find((b) => b.memberId === "2")?.balance).toBe(3000);
      // Charlie paid 0, owes 3000 (9000/3) = -3000
      expect(balances.find((b) => b.memberId === "3")?.balance).toBe(-3000);
    });
  });

  describe("generateTransactions", () => {
    it("should generate minimal transactions", () => {
      const balances = [
        { memberId: "1", name: "Alice", paid: 3000, owed: 3000, balance: 0 },
        { memberId: "2", name: "Bob", paid: 6000, owed: 3000, balance: 3000 },
        {
          memberId: "3",
          name: "Charlie",
          paid: 0,
          owed: 3000,
          balance: -3000,
        },
      ];

      const transactions = SettlementService.generateTransactions(balances);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        fromId: "3",
        fromName: "Charlie",
        toId: "2",
        toName: "Bob",
        amount: 3000,
      });
    });

    it("should handle multiple debtors and creditors", () => {
      const balances = [
        {
          memberId: "1",
          name: "Alice",
          paid: 5000,
          owed: 2500,
          balance: 2500,
        },
        { memberId: "2", name: "Bob", paid: 5000, owed: 2500, balance: 2500 },
        {
          memberId: "3",
          name: "Charlie",
          paid: 0,
          owed: 2500,
          balance: -2500,
        },
        { memberId: "4", name: "David", paid: 0, owed: 2500, balance: -2500 },
      ];

      const transactions = SettlementService.generateTransactions(balances);

      expect(transactions).toHaveLength(2);
      const totalFrom = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(totalFrom).toBe(5000);
    });
  });
});
