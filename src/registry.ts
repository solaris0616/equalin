import { SettlementUseCase } from '@/application/use-cases/SettlementUseCase';
import { SupabaseGroupRepository } from '@/infrastructure/repositories/SupabaseGroupRepository';
import { SupabasePaymentRepository } from '@/infrastructure/repositories/SupabasePaymentRepository';
import { SupabaseProfileRepository } from '@/infrastructure/repositories/SupabaseProfileRepository';

export const groupRepository = new SupabaseGroupRepository();
export const profileRepository = new SupabaseProfileRepository();
export const paymentRepository = new SupabasePaymentRepository();

export const settlementUseCase = new SettlementUseCase(
  groupRepository,
  paymentRepository,
);
