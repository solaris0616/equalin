/**
 * Domain entities for Equalin.
 */

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  isRoughMode: boolean;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
}

export interface Payment {
  id: string;
  groupId: string;
  payerMemberId: string;
  amount: number; // in cents
  description: string | null;
  createdAt: string;
}

export interface PaymentParticipant {
  paymentId: string;
  memberId: string;
}

/**
 * Extended payment info for UI display
 */
export interface PaymentWithDetails extends Payment {
  payerName: string;
  participantNames: string[];
  participantMemberIds: string[];
}

/**
 * Member with payment/debt info
 */
export interface MemberBalance {
  memberId: string;
  name: string;
  paid: number; // total paid (in cents)
  owed: number; // total share (in cents)
  balance: number; // paid - owed (in cents)
}

export interface SettlementTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number; // in cents
}

/**
 * Dashboard data for the group page
 */
export interface GroupDashboardData {
  group: { id: string; name: string; isRoughMode: boolean } | null;
  members: Member[];
  payments: PaymentWithDetails[];
  settlement: SettlementTransaction[];
  isCollaborator: boolean;
  isOwner: boolean;
}

/**
 * Internal representation for settlement calculation
 */
export interface PaymentWithParticipants {
  id: string;
  payerMemberId: string;
  amount: number;
  participantMemberIds: string[];
}
