import { GroupDashboardUseCase } from "@/core/application/use-cases/GroupDashboardUseCase";
import { SupabaseAuthRepository } from "@/core/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseGroupRepository } from "@/core/infrastructure/repositories/SupabaseGroupRepository";
import { SupabasePaymentRepository } from "@/core/infrastructure/repositories/SupabasePaymentRepository";

export const groupRepository = new SupabaseGroupRepository();
export const paymentRepository = new SupabasePaymentRepository();
export const authRepository = new SupabaseAuthRepository();

export const groupDashboardUseCase = new GroupDashboardUseCase(
  authRepository,
  groupRepository
);
