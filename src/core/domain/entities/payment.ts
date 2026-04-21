/**
 * Domain entities for Equalin.
 */

export interface Profile {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  groupId: string;
  payerId: string;
  amount: number; // in cents
  description: string | null;
  createdAt: string;
}

export interface PaymentParticipant {
  paymentId: string;
  profileId: string;
}

/**
 * Extended payment info for UI display
 */
export interface PaymentWithDetails extends Payment {
  payerName: string;
  participantNames: string[];
}

/**
 * Member with payment/debt info
 */
export interface MemberBalance {
  profileId: string;
  name: string;
  paid: number; // total paid (in cents)
  owed: number; // total share (in cents)
  balance: number; // paid - owed (in cents)
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number; // in cents
}

/**
 * Internal representation for settlement calculation
 */
export interface PaymentWithParticipants {
  id: string;
  payerId: string;
  amount: number;
  participantIds: string[];
}
