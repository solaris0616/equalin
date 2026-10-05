import type { GroupDashboardData } from "@/core/domain/entities/payment";
import type {
  IAuthRepository,
  IGroupRepository,
  IPaymentRepository,
} from "@/core/domain/repositories";

import { SettlementService } from "@/core/domain/services/SettlementService";

export class GroupDashboardUseCase {
  constructor(
    private authRepository: Pick<IAuthRepository, "getCurrentUser">,
    private groupRepository: Pick<
      IGroupRepository,
      "getById" | "isCollaborator" | "getMembers"
    >,
    private paymentRepository: Pick<IPaymentRepository, "getByGroupId">
  ) {}
  async execute(groupId: string): Promise<GroupDashboardData> {
    const [user, group] = await Promise.all([
      this.authRepository.getCurrentUser(),
      this.groupRepository.getById(groupId),
    ]);

    if (!user) {
      return {
        group: group
          ? { id: group.id, name: group.name, isRoughMode: group.isRoughMode }
          : null,
        members: [],
        payments: [],
        settlement: [],
        isCollaborator: false,
        isOwner: false,
      };
    }

    const isCollab = await this.groupRepository.isCollaborator(
      groupId,
      user.id
    );

    if (!isCollab) {
      return {
        group: group
          ? { id: group.id, name: group.name, isRoughMode: group.isRoughMode }
          : null,
        members: [],
        payments: [],
        settlement: [],
        isCollaborator: false,
        isOwner: group?.ownerId === user.id,
      };
    }

    // コラボレーターの場合は詳細データを取得
    const [members, payments] = await Promise.all([
      this.groupRepository.getMembers(groupId),
      this.paymentRepository.getByGroupId(groupId),
    ]);

    // 精算計算 (追加のDBクエリを避け、取得済みのデータを使用)
    const settlement =
      payments.length > 0
        ? SettlementService.generateTransactions(
            SettlementService.calculateBalances(payments, members),
            group?.isRoughMode
          )
        : [];

    return {
      group: group
        ? { id: group.id, name: group.name, isRoughMode: group.isRoughMode }
        : null,
      members,
      payments,
      settlement,
      isCollaborator: true,
      isOwner: group?.ownerId === user.id,
    };
  }
}
