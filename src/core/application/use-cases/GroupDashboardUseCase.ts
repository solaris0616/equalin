import type { GroupDashboardData } from "@/core/domain/entities/payment";
import type {
  IAuthRepository,
  IGroupRepository,
} from "@/core/domain/repositories";

import { SettlementService } from "@/core/domain/services/SettlementService";

export class GroupDashboardUseCase {
  constructor(
    private authRepository: Pick<IAuthRepository, "getCurrentUser">,
    private groupRepository: Pick<
      IGroupRepository,
      "getById" | "getDashboardSnapshot"
    >
  ) {}
  async execute(groupId: string): Promise<GroupDashboardData> {
    const [user, group, snapshot] = await Promise.all([
      this.authRepository.getCurrentUser(),
      this.groupRepository.getById(groupId),
      this.groupRepository.getDashboardSnapshot(groupId),
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
        invitationToken: null,
        nextPaymentCursor: null,
      };
    }

    if (!snapshot) {
      return {
        group: group
          ? { id: group.id, name: group.name, isRoughMode: group.isRoughMode }
          : null,
        members: [],
        payments: [],
        settlement: [],
        isCollaborator: false,
        isOwner: group?.ownerId === user.id,
        invitationToken: null,
        nextPaymentCursor: null,
      };
    }

    const settlement = SettlementService.generateTransactions(
      snapshot.balances,
      snapshot.group.isRoughMode
    );

    return {
      group: snapshot.group,
      members: snapshot.members,
      payments: snapshot.payments,
      settlement,
      isCollaborator: true,
      isOwner: group?.ownerId === user.id,
      invitationToken: snapshot.invitationToken,
      nextPaymentCursor: snapshot.nextPaymentCursor,
    };
  }
}
