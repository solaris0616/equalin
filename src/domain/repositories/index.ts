import type {
  Group,
  Payment,
  PaymentWithDetails,
  PaymentWithParticipants,
  Profile,
} from '../entities/payment';

export interface IGroupRepository {
  create(): Promise<Group>;
  getById(id: string): Promise<Group | null>;
  addMember(groupId: string, profileId: string): Promise<void>;
  getMembers(groupId: string): Promise<Profile[]>;
}

export interface IProfileRepository {
  create(profile: Profile): Promise<void>;
  getById(id: string): Promise<Profile | null>;
}

export interface IPaymentRepository {
  create(
    payment: Omit<Payment, 'id' | 'createdAt'>,
    participantIds: string[],
  ): Promise<void>;
  getByGroupId(groupId: string): Promise<PaymentWithDetails[]>;
  getWithParticipantsByGroupId(
    groupId: string,
  ): Promise<PaymentWithParticipants[]>;
  delete(paymentId: string, groupId: string): Promise<void>;
}
