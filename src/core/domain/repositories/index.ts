import type {
  Group,
  GroupDashboardSnapshot,
  Member,
  Payment,
  PaymentHistoryCursor,
  PaymentHistoryPage,
} from "../entities/payment";

export interface IGroupRepository {
  create(name: string, ownerId: string, memberNames: string[]): Promise<Group>;
  getById(id: string): Promise<Group | null>;
  getDashboardSnapshot(groupId: string): Promise<GroupDashboardSnapshot | null>;
  getPaymentHistory(
    groupId: string,
    cursor: PaymentHistoryCursor | null
  ): Promise<PaymentHistoryPage>;
  getInvitationToken(groupId: string): Promise<string | null>;
  rotateInvitationToken(groupId: string): Promise<string>;
  addMember(groupId: string, name: string): Promise<Member>;
  deleteMember(groupId: string, memberId: string): Promise<void>;
  addCollaborator(invitationToken: string): Promise<void>;
  updateRoughMode(groupId: string, isRoughMode: boolean): Promise<void>;
}

export interface IPaymentRepository {
  create(
    payment: Omit<Payment, "id" | "createdAt">,
    participantMemberIds: string[],
    clientRequestId: string
  ): Promise<void>;
  update(
    groupId: string,
    paymentId: string,
    payment: Omit<Payment, "id" | "groupId" | "createdAt">,
    participantMemberIds: string[]
  ): Promise<void>;
  delete(groupId: string, paymentId: string): Promise<void>;
}

export interface IAuthRepository {
  getCurrentUser(): Promise<{ id: string } | null>;
  signInAnonymously(): Promise<{ id: string }>;
}
