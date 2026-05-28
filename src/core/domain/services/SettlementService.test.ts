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

    // Boundary Case: All balances are zero
    it("should return empty transactions when all balances are zero", () => {
      const balances = [
        { memberId: "1", name: "Alice", paid: 1000, owed: 1000, balance: 0 },
        { memberId: "2", name: "Bob", paid: 2000, owed: 2000, balance: 0 },
      ];
      const transactions = SettlementService.generateTransactions(balances);
      expect(transactions).toEqual([]);
    });

    // Boundary Case: Tiny balances below 0.01 threshold
    it("should skip transactions for balances below 0.01 threshold", () => {
      const balances = [
        {
          memberId: "1",
          name: "Alice",
          paid: 1000.005,
          owed: 1000,
          balance: 0.005,
        },
        {
          memberId: "2",
          name: "Bob",
          paid: 999.995,
          owed: 1000,
          balance: -0.005,
        },
      ];
      const transactions = SettlementService.generateTransactions(balances);
      expect(transactions).toEqual([]);
    });

    // Boundary Case: Rounding / Fractions (e.g. 1000 divided by 3)
    it("should handle fractional balances with proper rounding", () => {
      const balances = [
        {
          memberId: "1",
          name: "Alice",
          paid: 1000,
          owed: 333.333,
          balance: 666.667,
        },
        {
          memberId: "2",
          name: "Bob",
          paid: 0,
          owed: 333.333,
          balance: -333.333,
        },
        {
          memberId: "3",
          name: "Charlie",
          paid: 0,
          owed: 333.333,
          balance: -333.333,
        },
      ];
      const transactions = SettlementService.generateTransactions(balances);
      expect(transactions).toHaveLength(2);
      expect(transactions[0].amount).toBe(333);
      expect(transactions[1].amount).toBe(333);
    });
  });

  describe("calculateBalances edge cases", () => {
    // Exceptional Case: Payment with empty participant list
    it("should safely ignore payments with empty participant lists", () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: "p1",
          payerMemberId: "1",
          amount: 3000,
          participantMemberIds: [], // Empty participants
        },
      ];
      const balances = SettlementService.calculateBalances(payments, members);
      // Alice paid 3000 but owes 0 because the payment had no participants
      expect(balances.find((b) => b.memberId === "1")?.balance).toBe(3000);
      expect(balances.find((b) => b.memberId === "2")?.balance).toBe(0);
    });

    // Exceptional Case: Payment references an unknown member ID
    it("should handle payments referencing unknown member IDs gracefully", () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: "p1",
          payerMemberId: "999", // Unknown payer
          amount: 3000,
          participantMemberIds: ["1", "999"], // Unknown participant
        },
      ];
      const balances = SettlementService.calculateBalances(payments, members);
      // Unknown payer/participant shouldn't crash the calculation for known members
      // Alice ("1") owes 1500 (3000/2) and paid 0 -> balance: -1500
      expect(balances.find((b) => b.memberId === "1")?.balance).toBe(-1500);
    });
  });
});
