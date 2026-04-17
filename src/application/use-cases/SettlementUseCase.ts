import type { SettlementTransaction } from '@/src/domain/entities/payment';
import type {
  IGroupRepository,
  IPaymentRepository,
} from '@/src/domain/repositories';
import { SettlementService } from '@/src/domain/services/SettlementService';

export class SettlementUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private paymentRepo: IPaymentRepository,
  ) {}

  async execute(groupId: string): Promise<SettlementTransaction[]> {
    const [members, payments] = await Promise.all([
      this.groupRepo.getMembers(groupId),
      this.paymentRepo.getWithParticipantsByGroupId(groupId),
    ]);

    if (payments.length === 0) return [];

    const balances = SettlementService.calculateBalances(payments, members);
    return SettlementService.generateTransactions(balances);
  }
}
