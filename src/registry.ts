import { SettlementUseCase } from '@/src/application/use-cases/SettlementUseCase';
import { SupabaseGroupRepository } from '@/src/infrastructure/repositories/SupabaseGroupRepository';
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/SupabasePaymentRepository';
import { SupabaseProfileRepository } from '@/src/infrastructure/repositories/SupabaseProfileRepository';

export const groupRepository = new SupabaseGroupRepository();
export const profileRepository = new SupabaseProfileRepository();
export const paymentRepository = new SupabasePaymentRepository();

export const settlementUseCase = new SettlementUseCase(
  groupRepository,
  paymentRepository,
);
