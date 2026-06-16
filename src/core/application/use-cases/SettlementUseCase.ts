import type { SettlementTransaction } from "@/core/domain/entities/payment";
import type {
  IGroupRepository,
  IPaymentRepository,
} from "@/core/domain/repositories";

import { SettlementService } from "@/core/domain/services/SettlementService";

export class SettlementUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private paymentRepo: IPaymentRepository
  ) {}

  async execute(groupId: string): Promise<SettlementTransaction[]> {
    const [group, members, payments] = await Promise.all([
      this.groupRepo.getById(groupId),
      this.groupRepo.getMembers(groupId),
      this.paymentRepo.getWithParticipantsByGroupId(groupId),
    ]);

    if (payments.length === 0) return [];

    const balances = SettlementService.calculateBalances(payments, members);
    return SettlementService.generateTransactions(balances, group?.isRoughMode);
  }
}
