import { describe, expect, it, mock, beforeEach } from "bun:test";

import {
  createGroup,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentWithParticipants,
  getGroupPayments,
  getGroupMembers,
  addMember,
  deleteMember,
  joinGroup,
  calculateSettlement,
  getGroupDashboardData,
  isGroupOwner,
  isGroupCollaborator,
  updateRoughMode,
} from "./payments";

// ---------------------------------------------------------------------------
// Module mocks
// All mock functions are declared here so tests can control them via
// .mockResolvedValue / .mockRejectedValue per-test.
// ---------------------------------------------------------------------------
const mockGetCurrentUser = mock();
const mockSignInAnonymously = mock();
const mockGroupCreate = mock();
const mockGroupAddMember = mock();
const mockGroupDeleteMember = mock();
const mockGroupGetMembers = mock();
const mockGroupGetById = mock();
const mockGroupAddCollaborator = mock();
const mockGroupIsCollaborator = mock();
const mockGroupUpdateRoughMode = mock();
const mockPaymentCreate = mock();
const mockPaymentUpdate = mock();
const mockPaymentDelete = mock();
const mockPaymentGetById = mock();
const mockPaymentGetByGroupId = mock();
const mockPaymentGetWithParticipants = mock();
const mockSettlementExecute = mock();
const mockRevalidatePath = mock();

mock.module("@/core/registry", () => ({
  authRepository: {
    getCurrentUser: mockGetCurrentUser,
    signInAnonymously: mockSignInAnonymously,
  },
  groupRepository: {
    create: mockGroupCreate,
    addMember: mockGroupAddMember,
    deleteMember: mockGroupDeleteMember,
    getMembers: mockGroupGetMembers,
    getById: mockGroupGetById,
    addCollaborator: mockGroupAddCollaborator,
    isCollaborator: mockGroupIsCollaborator,
    updateRoughMode: mockGroupUpdateRoughMode,
  },
  paymentRepository: {
    create: mockPaymentCreate,
    update: mockPaymentUpdate,
    delete: mockPaymentDelete,
    getByIdWithParticipants: mockPaymentGetById,
    getByGroupId: mockPaymentGetByGroupId,
    getWithParticipantsByGroupId: mockPaymentGetWithParticipants,
  },
  settlementUseCase: {
    execute: mockSettlementExecute,
  },
}));

mock.module("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeGroup = (overrides = {}) => ({
  id: "g1",
  name: "Test Group",
  ownerId: "user1",
  shareId: "share1",
  createdAt: "2024-01-01T00:00:00Z",
  isRoughMode: false,
  ...overrides,
});
const makeMember = (id: string, name: string) => ({ id, name, groupId: "g1" });
const makePayment = (overrides = {}) => ({
  id: "p1",
  groupId: "g1",
  payerMemberId: "m1",
  amount: 1000,
  description: "Lunch",
  createdAt: "2024-01-01T00:00:00Z",
  participantMemberIds: ["m1", "m2"],
  payerName: "Alice",
  participantNames: ["Alice", "Bob"],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------
const allMocks = [
  mockGetCurrentUser,
  mockSignInAnonymously,
  mockGroupCreate,
  mockGroupAddMember,
  mockGroupDeleteMember,
  mockGroupGetMembers,
  mockGroupGetById,
  mockGroupAddCollaborator,
  mockGroupIsCollaborator,
  mockGroupUpdateRoughMode,
  mockPaymentCreate,
  mockPaymentUpdate,
  mockPaymentDelete,
  mockPaymentGetById,
  mockPaymentGetByGroupId,
  mockPaymentGetWithParticipants,
  mockSettlementExecute,
  mockRevalidatePath,
];

describe("payments actions", () => {
  beforeEach(() => {
    // Clear call history and reset implementations for all mocks
    for (const m of allMocks) {
      m.mockReset();
    }
    // Default: authenticated user
    mockGetCurrentUser.mockResolvedValue({ id: "user1" });
  });

  // =========================================================================
  // createGroup
  // =========================================================================
  describe("createGroup", () => {
    it("signs in anonymously and creates group when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockSignInAnonymously.mockResolvedValue({ id: "anon1" });
      mockGroupCreate.mockResolvedValue(
        makeGroup({ id: "g1", ownerId: "anon1" })
      );
      mockGroupAddMember.mockResolvedValue({});

      const result = await createGroup("New Group", ["Alice", "Bob"]);

      expect(result.success).toBe(true);
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(mockGroupCreate).toHaveBeenCalledWith("New Group", "anon1");
    });

    it("fails with empty group name", async () => {
      const result = await createGroup("", ["Alice", "Bob"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("グループ名を入力してください");
      expect(mockGroupCreate).not.toHaveBeenCalled();
    });

    it("fails with whitespace-only group name", async () => {
      const result = await createGroup("   ", ["Alice", "Bob"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("グループ名を入力してください");
    });

    it("fails when fewer than 2 valid members are provided (boundary: 1 member)", async () => {
      const result = await createGroup("Group", ["Alice"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーを2名以上追加してください");
    });

    it("ignores empty member names and fails if fewer than 2 remain", async () => {
      const result = await createGroup("Group", ["Alice", " ", ""]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーを2名以上追加してください");
    });

    it("succeeds with exactly 2 members (boundary: min valid)", async () => {
      mockGroupCreate.mockResolvedValue(makeGroup());
      mockGroupAddMember.mockResolvedValue({});

      const result = await createGroup("Group", ["Alice", "Bob"]);

      expect(result.success).toBe(true);
      expect(mockGroupCreate).toHaveBeenCalledWith("Group", "user1");
      expect(mockGroupAddMember).toHaveBeenCalledTimes(2);
    });

    it("skips empty member names but adds valid ones", async () => {
      mockGroupCreate.mockResolvedValue(makeGroup());
      mockGroupAddMember.mockResolvedValue({});

      await createGroup("Group", ["Alice", "", "Bob"]);

      expect(mockGroupAddMember).toHaveBeenCalledTimes(2);
    });

    it("returns error when repository throws", async () => {
      mockGroupCreate.mockRejectedValue(new Error("DB error"));

      const result = await createGroup("Group", ["Alice", "Bob"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("グループの作成に失敗しました");
    });
  });

  // =========================================================================
  // createPayment
  // =========================================================================
  describe("createPayment", () => {
    it("succeeds with valid inputs", async () => {
      mockPaymentCreate.mockResolvedValue(undefined);

      const result = await createPayment("g1", "m1", 1000, "Lunch", [
        "m1",
        "m2",
      ]);

      expect(result.success).toBe(true);
      expect(mockPaymentCreate).toHaveBeenCalledWith(
        {
          groupId: "g1",
          payerMemberId: "m1",
          amount: 1000,
          description: "Lunch",
        },
        ["m1", "m2"]
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("converts empty description to null", async () => {
      mockPaymentCreate.mockResolvedValue(undefined);

      await createPayment("g1", "m1", 1000, "", ["m1"]);

      expect(mockPaymentCreate).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.anything()
      );
    });

    it("fails when no participants (boundary: 0 participants)", async () => {
      const result = await createPayment("g1", "m1", 1000, "test", []);
      expect(result.success).toBe(false);
      expect(result.error).toBe("参加者を1人以上選択してください");
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });

    it("fails when amount is 0 (boundary: below min)", async () => {
      const result = await createPayment("g1", "m1", 0, "test", ["m1"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("fails when amount is negative", async () => {
      const result = await createPayment("g1", "m1", -1, "test", ["m1"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("succeeds when amount is 1 (boundary: min valid)", async () => {
      mockPaymentCreate.mockResolvedValue(undefined);
      const result = await createPayment("g1", "m1", 1, "test", ["m1"]);
      expect(result.success).toBe(true);
    });

    it("succeeds when amount is 999999999 (boundary: max valid)", async () => {
      mockPaymentCreate.mockResolvedValue(undefined);
      const result = await createPayment("g1", "m1", 999999999, "test", ["m1"]);
      expect(result.success).toBe(true);
    });

    it("fails when amount is 1000000000 (boundary: above max)", async () => {
      const result = await createPayment("g1", "m1", 1000000000, "test", [
        "m1",
      ]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("fails when amount is a float", async () => {
      const result = await createPayment("g1", "m1", 1.5, "test", ["m1"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("returns error message from repository on failure", async () => {
      mockPaymentCreate.mockRejectedValue(
        new Error("Unique constraint violation")
      );

      const result = await createPayment("g1", "m1", 1000, "test", ["m1"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unique constraint violation");
    });

    it("returns fallback error message when non-Error is thrown", async () => {
      mockPaymentCreate.mockRejectedValue("unknown");

      const result = await createPayment("g1", "m1", 1000, "test", ["m1"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("支払いの作成に失敗しました");
    });
  });

  // =========================================================================
  // updatePayment
  // =========================================================================
  describe("updatePayment", () => {
    it("succeeds with valid inputs", async () => {
      mockPaymentUpdate.mockResolvedValue(undefined);

      const result = await updatePayment("g1", "p1", "m1", 2000, "Dinner", [
        "m1",
        "m2",
      ]);

      expect(result.success).toBe(true);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        "p1",
        { payerMemberId: "m1", amount: 2000, description: "Dinner" },
        ["m1", "m2"]
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("fails when no participants", async () => {
      const result = await updatePayment("g1", "p1", "m1", 1000, "test", []);
      expect(result.success).toBe(false);
      expect(result.error).toBe("参加者を1人以上選択してください");
    });

    it("fails when amount is 0 (boundary: below min)", async () => {
      const result = await updatePayment("g1", "p1", "m1", 0, "test", ["m1"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("succeeds when amount is 1 (boundary: min valid)", async () => {
      mockPaymentUpdate.mockResolvedValue(undefined);
      const result = await updatePayment("g1", "p1", "m1", 1, "test", ["m1"]);
      expect(result.success).toBe(true);
    });

    it("fails when amount is 1000000000 (boundary: above max)", async () => {
      const result = await updatePayment("g1", "p1", "m1", 1000000000, "test", [
        "m1",
      ]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("有効な金額を入力してください");
    });

    it("returns error from repository on failure", async () => {
      mockPaymentUpdate.mockRejectedValue(new Error("Update failed"));

      const result = await updatePayment("g1", "p1", "m1", 1000, "test", [
        "m1",
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  // =========================================================================
  // deletePayment
  // =========================================================================
  describe("deletePayment", () => {
    it("succeeds and revalidates path", async () => {
      mockPaymentDelete.mockResolvedValue(undefined);

      const result = await deletePayment("g1", "p1");

      expect(result.success).toBe(true);
      expect(mockPaymentDelete).toHaveBeenCalledWith("p1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("returns error message from repository on failure", async () => {
      mockPaymentDelete.mockRejectedValue(new Error("Delete failed"));

      const result = await deletePayment("g1", "p1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });

    it("returns fallback error when non-Error is thrown", async () => {
      mockPaymentDelete.mockRejectedValue("unknown");

      const result = await deletePayment("g1", "p1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("削除に失敗しました");
    });
  });

  // =========================================================================
  // getPaymentWithParticipants
  // =========================================================================
  describe("getPaymentWithParticipants", () => {
    it("returns payment data on success", async () => {
      const payment = {
        id: "p1",
        payerMemberId: "m1",
        amount: 1000,
        participantMemberIds: ["m1", "m2"],
      };
      mockPaymentGetById.mockResolvedValue(payment);

      const result = await getPaymentWithParticipants("p1");

      expect(result).toEqual(payment);
    });

    it("returns null when payment is not found", async () => {
      mockPaymentGetById.mockResolvedValue(null);

      const result = await getPaymentWithParticipants("unknown");

      expect(result).toBeNull();
    });

    it("returns null on repository error", async () => {
      mockPaymentGetById.mockRejectedValue(new Error("DB error"));

      const result = await getPaymentWithParticipants("p1");

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // getGroupPayments
  // =========================================================================
  describe("getGroupPayments", () => {
    it("returns payments list on success", async () => {
      const payments = [makePayment()];
      mockPaymentGetByGroupId.mockResolvedValue(payments);

      const result = await getGroupPayments("g1");

      expect(result).toEqual(payments);
    });

    it("returns empty array when group has no payments", async () => {
      mockPaymentGetByGroupId.mockResolvedValue([]);

      const result = await getGroupPayments("g1");

      expect(result).toEqual([]);
    });

    it("returns empty array on repository error", async () => {
      mockPaymentGetByGroupId.mockRejectedValue(new Error("DB error"));

      const result = await getGroupPayments("g1");

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getGroupMembers
  // =========================================================================
  describe("getGroupMembers", () => {
    it("returns members list on success", async () => {
      const members = [makeMember("m1", "Alice"), makeMember("m2", "Bob")];
      mockGroupGetMembers.mockResolvedValue(members);

      const result = await getGroupMembers("g1");

      expect(result).toEqual(members);
    });

    it("returns empty array on repository error", async () => {
      mockGroupGetMembers.mockRejectedValue(new Error("DB error"));

      const result = await getGroupMembers("g1");

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // addMember
  // =========================================================================
  describe("addMember", () => {
    it("succeeds and returns the new member", async () => {
      const newMember = makeMember("m3", "Charlie");
      mockGroupAddMember.mockResolvedValue(newMember);

      const result = await addMember("g1", "Charlie");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newMember);
      expect(mockGroupAddMember).toHaveBeenCalledWith("g1", "Charlie");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("returns error on repository failure", async () => {
      mockGroupAddMember.mockRejectedValue(new Error("DB error"));

      const result = await addMember("g1", "Charlie");

      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーの追加に失敗しました");
    });
  });

  // =========================================================================
  // deleteMember
  // =========================================================================
  describe("deleteMember", () => {
    it("fails when exactly 2 members remain (boundary: min members)", async () => {
      mockGroupGetMembers.mockResolvedValue([
        makeMember("m1", "Alice"),
        makeMember("m2", "Bob"),
      ]);

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("グループには最低2名のメンバーが必要です。");
      expect(mockGroupDeleteMember).not.toHaveBeenCalled();
    });

    it("fails when exactly 1 member remains (boundary: below min)", async () => {
      mockGroupGetMembers.mockResolvedValue([makeMember("m1", "Alice")]);

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("グループには最低2名のメンバーが必要です。");
    });

    it("succeeds when 3 members exist (boundary: min+1)", async () => {
      mockGroupGetMembers.mockResolvedValue([
        makeMember("m1", "Alice"),
        makeMember("m2", "Bob"),
        makeMember("m3", "Charlie"),
      ]);
      mockGroupDeleteMember.mockResolvedValue(undefined);

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(true);
      expect(mockGroupDeleteMember).toHaveBeenCalledWith("m1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("returns error on repository failure", async () => {
      mockGroupGetMembers.mockRejectedValue(new Error("DB error"));

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーの削除に失敗しました");
    });
  });

  // =========================================================================
  // joinGroup
  // =========================================================================
  describe("joinGroup", () => {
    it("succeeds when user is authenticated", async () => {
      mockGroupAddCollaborator.mockResolvedValue(undefined);

      const result = await joinGroup("g1");

      expect(result.success).toBe(true);
      expect(mockGroupAddCollaborator).toHaveBeenCalledWith("g1", "user1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });

    it("fails when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await joinGroup("g1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("認証に失敗しました");
      expect(mockGroupAddCollaborator).not.toHaveBeenCalled();
    });

    it("returns error message from repository on failure", async () => {
      mockGroupAddCollaborator.mockRejectedValue(
        new Error("Already a collaborator")
      );

      const result = await joinGroup("g1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Already a collaborator");
    });

    it("returns fallback error when non-Error is thrown", async () => {
      mockGroupAddCollaborator.mockRejectedValue("unknown");

      const result = await joinGroup("g1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("グループへの参加に失敗しました");
    });
  });

  // =========================================================================
  // calculateSettlement
  // =========================================================================
  describe("calculateSettlement", () => {
    it("returns settlement transactions on success", async () => {
      const transactions = [
        {
          fromId: "m2",
          fromName: "Bob",
          toId: "m1",
          toName: "Alice",
          amount: 500,
        },
      ];
      mockSettlementExecute.mockResolvedValue(transactions);

      const result = await calculateSettlement("g1");

      expect(result).toEqual(transactions);
      expect(mockSettlementExecute).toHaveBeenCalledWith("g1");
    });

    it("returns empty array when no settlements needed", async () => {
      mockSettlementExecute.mockResolvedValue([]);

      const result = await calculateSettlement("g1");

      expect(result).toEqual([]);
    });

    it("returns empty array on error", async () => {
      mockSettlementExecute.mockRejectedValue(new Error("Calculation failed"));

      const result = await calculateSettlement("g1");

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // isGroupOwner
  // =========================================================================
  describe("isGroupOwner", () => {
    it("returns true when user is the owner", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "user1" }));

      const result = await isGroupOwner("g1");

      expect(result).toBe(true);
    });

    it("returns false when user is not the owner", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "other-user" }));

      const result = await isGroupOwner("g1");

      expect(result).toBe(false);
    });

    it("returns false when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await isGroupOwner("g1");

      expect(result).toBe(false);
      expect(mockGroupGetById).not.toHaveBeenCalled();
    });

    it("returns false when group does not exist", async () => {
      mockGroupGetById.mockResolvedValue(null);

      const result = await isGroupOwner("g1");

      expect(result).toBe(false);
    });

    it("returns false on repository error", async () => {
      mockGroupGetById.mockRejectedValue(new Error("DB error"));

      const result = await isGroupOwner("g1");

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // isGroupCollaborator
  // =========================================================================
  describe("isGroupCollaborator", () => {
    it("returns true when user is a collaborator", async () => {
      mockGroupIsCollaborator.mockResolvedValue(true);

      const result = await isGroupCollaborator("g1");

      expect(result).toBe(true);
      expect(mockGroupIsCollaborator).toHaveBeenCalledWith("g1", "user1");
    });

    it("returns false when user is not a collaborator", async () => {
      mockGroupIsCollaborator.mockResolvedValue(false);

      const result = await isGroupCollaborator("g1");

      expect(result).toBe(false);
    });

    it("returns false when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await isGroupCollaborator("g1");

      expect(result).toBe(false);
      expect(mockGroupIsCollaborator).not.toHaveBeenCalled();
    });

    it("returns false on repository error", async () => {
      mockGroupIsCollaborator.mockRejectedValue(new Error("DB error"));

      const result = await isGroupCollaborator("g1");

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // getGroupDashboardData
  // =========================================================================
  describe("getGroupDashboardData", () => {
    it("returns minimal data when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockGroupGetById.mockResolvedValue(makeGroup());

      const result = await getGroupDashboardData("g1");

      expect(result.isCollaborator).toBe(false);
      expect(result.isOwner).toBe(false);
      expect(result.members).toEqual([]);
      expect(result.payments).toEqual([]);
      expect(result.group).toEqual({
        id: "g1",
        name: "Test Group",
        isRoughMode: false,
      });
    });

    it("returns minimal data when user is not a collaborator", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "other-user" }));
      mockGroupIsCollaborator.mockResolvedValue(false);

      const result = await getGroupDashboardData("g1");

      expect(result.isCollaborator).toBe(false);
      expect(result.isOwner).toBe(false);
      expect(result.members).toEqual([]);
    });

    it("marks isOwner=true when non-collaborator is the group owner", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "user1" }));
      mockGroupIsCollaborator.mockResolvedValue(false);

      const result = await getGroupDashboardData("g1");

      expect(result.isOwner).toBe(true);
      expect(result.isCollaborator).toBe(false);
    });

    it("returns full data when user is a collaborator with payments", async () => {
      const members = [makeMember("m1", "Alice"), makeMember("m2", "Bob")];
      const payments = [makePayment()];
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "other-user" }));
      mockGroupIsCollaborator.mockResolvedValue(true);
      mockGroupGetMembers.mockResolvedValue(members);
      mockPaymentGetByGroupId.mockResolvedValue(payments);

      const result = await getGroupDashboardData("g1");

      expect(result.isCollaborator).toBe(true);
      expect(result.members).toEqual(members);
      expect(result.payments).toEqual(payments);
    });

    it("returns empty settlement when collaborator has no payments", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup());
      mockGroupIsCollaborator.mockResolvedValue(true);
      mockGroupGetMembers.mockResolvedValue([makeMember("m1", "Alice")]);
      mockPaymentGetByGroupId.mockResolvedValue([]);

      const result = await getGroupDashboardData("g1");

      expect(result.settlement).toEqual([]);
    });

    it("returns null group when group does not exist and user is unauthenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockGroupGetById.mockResolvedValue(null);

      const result = await getGroupDashboardData("g1");

      expect(result.group).toBeNull();
    });

    it("returns fallback data on unexpected error", async () => {
      mockGroupGetById.mockRejectedValue(new Error("DB error"));

      const result = await getGroupDashboardData("g1");

      expect(result.group).toBeNull();
      expect(result.members).toEqual([]);
      expect(result.isCollaborator).toBe(false);
    });
  });

  // =========================================================================
  // updateRoughMode
  // =========================================================================
  describe("updateRoughMode", () => {
    it("fails if user is unauthenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const result = await updateRoughMode("g1", true);
      expect(result.success).toBe(false);
      expect(result.error).toBe("認証に失敗しました");
    });

    it("fails if group does not exist", async () => {
      mockGroupGetById.mockResolvedValue(null);
      const result = await updateRoughMode("g1", true);
      expect(result.success).toBe(false);
      expect(result.error).toBe("グループが見つかりません");
    });

    it("fails if user is not the owner", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "user2" }));
      const result = await updateRoughMode("g1", true);
      expect(result.success).toBe(false);
      expect(result.error).toBe("オーナーのみが設定を変更できます");
    });

    it("successfully updates rough mode and revalidates path", async () => {
      mockGroupGetById.mockResolvedValue(makeGroup({ ownerId: "user1" }));
      mockGroupUpdateRoughMode.mockResolvedValue(undefined);
      const result = await updateRoughMode("g1", true);
      expect(result.success).toBe(true);
      expect(mockGroupUpdateRoughMode).toHaveBeenCalledWith("g1", true);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
    });
  });
});
