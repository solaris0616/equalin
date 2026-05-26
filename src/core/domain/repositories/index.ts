import type {
  Group,
  Member,
  Payment,
  PaymentWithDetails,
  PaymentWithParticipants,
} from "../entities/payment";

export interface IGroupRepository {
  create(name: string, ownerId: string): Promise<Group>;
  getById(id: string): Promise<Group | null>;
  addMember(groupId: string, name: string): Promise<Member>;
  deleteMember(memberId: string): Promise<void>;
  getMembers(groupId: string): Promise<Member[]>;
  addCollaborator(groupId: string, userId: string): Promise<void>;
  isCollaborator(groupId: string, userId: string): Promise<boolean>;
}

export interface IPaymentRepository {
  create(
    payment: Omit<Payment, "id" | "createdAt">,
    participantMemberIds: string[]
  ): Promise<void>;
  update(
    paymentId: string,
    payment: Partial<Omit<Payment, "id" | "groupId" | "createdAt">>,
    participantMemberIds: string[]
  ): Promise<void>;
  getByIdWithParticipants(
    paymentId: string
  ): Promise<PaymentWithParticipants | null>;
  getByGroupId(groupId: string): Promise<PaymentWithDetails[]>;
  getWithParticipantsByGroupId(
    groupId: string
  ): Promise<PaymentWithParticipants[]>;
  delete(paymentId: string): Promise<void>;
}
