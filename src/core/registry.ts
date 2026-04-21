import { SettlementUseCase } from '@/core/application/use-cases/SettlementUseCase';
import { SupabaseGroupRepository } from '@/core/infrastructure/repositories/SupabaseGroupRepository';
import { SupabasePaymentRepository } from '@/core/infrastructure/repositories/SupabasePaymentRepository';
import { SupabaseProfileRepository } from '@/core/infrastructure/repositories/SupabaseProfileRepository';

export const groupRepository = new SupabaseGroupRepository();
export const profileRepository = new SupabaseProfileRepository();
export const paymentRepository = new SupabasePaymentRepository();

export const settlementUseCase = new SettlementUseCase(
  groupRepository,
  paymentRepository,
);
