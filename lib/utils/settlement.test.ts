import { describe, expect, it } from 'bun:test';
import {
  calculateMemberBalances,
  calculateSettlement,
  calculateTotalOwed,
  calculateTotalPaid,
  generateSettlementTransactions,
  type Member,
  type PaymentWithParticipants,
} from './settlement';

describe('Settlement Calculation', () => {
  const members: Member[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
  ];

  describe('calculateTotalPaid', () => {
    it('should calculate total paid by each member', () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: 'p1',
          payer_id: '1',
          amount: 3000,
          participant_ids: ['1', '2', '3'],
        },
        {
          id: 'p2',
          payer_id: '2',
          amount: 6000,
          participant_ids: ['1', '2', '3'],
        },
      ];

      const totalPaid = calculateTotalPaid(payments, members);

      expect(totalPaid.get('1')).toBe(3000);
      expect(totalPaid.get('2')).toBe(6000);
      expect(totalPaid.get('3')).toBe(0);
    });

    it('should initialize all members with 0', () => {
      const payments: PaymentWithParticipants[] = [];
      const totalPaid = calculateTotalPaid(payments, members);

      expect(totalPaid.get('1')).toBe(0);
      expect(totalPaid.get('2')).toBe(0);
      expect(totalPaid.get('3')).toBe(0);
    });
  });

  describe('calculateTotalOwed', () => {
    it('should calculate equal shares for all participants', () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: 'p1',
          payer_id: '1',
          amount: 3000,
          participant_ids: ['1', '2', '3'],
        },
      ];

      const totalOwed = calculateTotalOwed(payments, members);

      expect(totalOwed.get('1')).toBe(1000);
      expect(totalOwed.get('2')).toBe(1000);
      expect(totalOwed.get('3')).toBe(1000);
    });

    it('should handle payments with different participants', () => {
      const payments: PaymentWithParticipants[] = [
        { id: 'p1', payer_id: '1', amount: 2000, participant_ids: ['1', '2'] },
        { id: 'p2', payer_id: '2', amount: 3000, participant_ids: ['2', '3'] },
      ];

      const totalOwed = calculateTotalOwed(payments, members);

      expect(totalOwed.get('1')).toBe(1000); // 2000/2
      expect(totalOwed.get('2')).toBe(2500); // 2000/2 + 3000/2
      expect(totalOwed.get('3')).toBe(1500); // 3000/2
    });
  });

  describe('calculateMemberBalances', () => {
    it('should calculate correct balances', () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: 'p1',
          payer_id: '1',
          amount: 3000,
          participant_ids: ['1', '2', '3'],
        },
        {
          id: 'p2',
          payer_id: '2',
          amount: 6000,
          participant_ids: ['1', '2', '3'],
        },
      ];

      const balances = calculateMemberBalances(payments, members);

      // Alice paid 3000, owes 3000 (9000/3) = 0
      expect(balances.find((b) => b.profile_id === '1')?.balance).toBe(0);
      // Bob paid 6000, owes 3000 (9000/3) = +3000
      expect(balances.find((b) => b.profile_id === '2')?.balance).toBe(3000);
      // Charlie paid 0, owes 3000 (9000/3) = -3000
      expect(balances.find((b) => b.profile_id === '3')?.balance).toBe(-3000);
    });
  });

  describe('generateSettlementTransactions', () => {
    it('should generate minimal transactions', () => {
      const balances = [
        { profile_id: '1', name: 'Alice', paid: 3000, owed: 3000, balance: 0 },
        { profile_id: '2', name: 'Bob', paid: 6000, owed: 3000, balance: 3000 },
        {
          profile_id: '3',
          name: 'Charlie',
          paid: 0,
          owed: 3000,
          balance: -3000,
        },
      ];

      const transactions = generateSettlementTransactions(balances);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        from: 'Charlie',
        to: 'Bob',
        amount: 3000,
      });
    });

    it('should handle multiple debtors and creditors', () => {
      const balances = [
        {
          profile_id: '1',
          name: 'Alice',
          paid: 5000,
          owed: 2500,
          balance: 2500,
        },
        { profile_id: '2', name: 'Bob', paid: 5000, owed: 2500, balance: 2500 },
        {
          profile_id: '3',
          name: 'Charlie',
          paid: 0,
          owed: 2500,
          balance: -2500,
        },
        { profile_id: '4', name: 'David', paid: 0, owed: 2500, balance: -2500 },
      ];

      const transactions = generateSettlementTransactions(balances);

      // Should have 2 transactions (minimal)
      expect(transactions).toHaveLength(2);

      // Verify total amounts balance
      const totalFrom = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(totalFrom).toBe(5000);
    });

    it('should return empty array when all balances are zero', () => {
      const balances = [
        { profile_id: '1', name: 'Alice', paid: 1000, owed: 1000, balance: 0 },
        { profile_id: '2', name: 'Bob', paid: 1000, owed: 1000, balance: 0 },
      ];

      const transactions = generateSettlementTransactions(balances);

      expect(transactions).toHaveLength(0);
    });
  });

  describe('calculateSettlement', () => {
    it('should calculate complete settlement', () => {
      const payments: PaymentWithParticipants[] = [
        {
          id: 'p1',
          payer_id: '1',
          amount: 3000,
          participant_ids: ['1', '2', '3'],
        },
        {
          id: 'p2',
          payer_id: '2',
          amount: 6000,
          participant_ids: ['1', '2', '3'],
        },
      ];

      const transactions = calculateSettlement(payments, members);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        from: 'Charlie',
        to: 'Bob',
        amount: 3000,
      });
    });

    it('should handle empty payments', () => {
      const payments: PaymentWithParticipants[] = [];
      const transactions = calculateSettlement(payments, members);

      expect(transactions).toHaveLength(0);
    });

    it('should handle single member group', () => {
      const singleMember: Member[] = [{ id: '1', name: 'Alice' }];
      const payments: PaymentWithParticipants[] = [
        { id: 'p1', payer_id: '1', amount: 1000, participant_ids: ['1'] },
      ];

      const transactions = calculateSettlement(payments, singleMember);

      expect(transactions).toHaveLength(0);
    });
  });
});
