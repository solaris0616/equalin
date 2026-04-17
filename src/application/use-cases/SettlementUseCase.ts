import type { SettlementTransaction } from '@/domain/entities/payment';
import type {
  IGroupRepository,
  IPaymentRepository,
} from '@/domain/repositories';
import { SettlementService } from '@/domain/services/SettlementService';

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
