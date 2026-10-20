import { beforeEach, describe, expect, it, mock } from "bun:test";

import {
  createGroup,
  createPayment,
  getGroupDashboardData,
  getGroupPaymentHistory,
  joinGroup,
  rotateInvitation,
  updatePayment,
} from "./payments";

const mockGetCurrentUser = mock();
const mockSignInAnonymously = mock();
const mockGroupCreate = mock();
const mockGroupAddCollaborator = mock();
const mockGroupRotateInvitation = mock();
const mockGroupGetPaymentHistory = mock();
const mockPaymentCreate = mock();
const mockPaymentUpdate = mock();
const mockDashboardExecute = mock();
const mockRevalidatePath = mock();

mock.module("@/core/registry", () => ({
  authRepository: {
    getCurrentUser: mockGetCurrentUser,
    signInAnonymously: mockSignInAnonymously,
  },
  groupRepository: {
    create: mockGroupCreate,
    addCollaborator: mockGroupAddCollaborator,
    rotateInvitationToken: mockGroupRotateInvitation,
    getPaymentHistory: mockGroupGetPaymentHistory,
  },
  paymentRepository: {
    create: mockPaymentCreate,
    update: mockPaymentUpdate,
  },
  groupDashboardUseCase: { execute: mockDashboardExecute },
}));
mock.module("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const requestId = "01234567-89ab-4def-8123-456789abcdef";
const invitationToken = "a".repeat(32);
const group = {
  id: "g1",
  name: "Test Group",
  ownerId: "user1",
  createdAt: "2024-01-01T00:00:00Z",
  isRoughMode: false,
  invitationToken,
};

beforeEach(() => {
  for (const fn of [
    mockGetCurrentUser,
    mockSignInAnonymously,
    mockGroupCreate,
    mockGroupAddCollaborator,
    mockGroupRotateInvitation,
    mockGroupGetPaymentHistory,
    mockPaymentCreate,
    mockPaymentUpdate,
    mockDashboardExecute,
    mockRevalidatePath,
  ]) {
    fn.mockReset();
  }
  mockGetCurrentUser.mockResolvedValue({ id: "user1" });
});

describe("payment actions", () => {
  it("validates input before creating an anonymous account", async () => {
    const result = await createGroup("", ["Alice", "Bob"]);
    expect(result.success).toBe(false);
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it("creates the group and returns its invitation token", async () => {
    mockGroupCreate.mockResolvedValue(group);
    expect(await createGroup(" Group ", ["Alice", "Bob"])).toEqual({
      success: true,
      data: group,
    });
    expect(mockGroupCreate).toHaveBeenCalledWith("Group", "user1", [
      "Alice",
      "Bob",
    ]);
  });

  it("passes one stable client request ID when creating a payment", async () => {
    mockPaymentCreate.mockResolvedValue(undefined);
    const result = await createPayment(
      "g1",
      "m1",
      1000,
      "Lunch",
      ["m1", "m2"],
      requestId
    );
    expect(result.success).toBe(true);
    expect(mockPaymentCreate).toHaveBeenCalledWith(
      {
        groupId: "g1",
        payerMemberId: "m1",
        amount: 1000,
        description: "Lunch",
      },
      ["m1", "m2"],
      requestId
    );
  });

  it("rejects a malformed request ID before writing", async () => {
    const result = await createPayment(
      "g1",
      "m1",
      1000,
      "Lunch",
      ["m1"],
      "bad"
    );
    expect(result).toEqual({
      success: false,
      error: "リクエストを再試行してください",
    });
    expect(mockPaymentCreate).not.toHaveBeenCalled();
  });

  it("does not use a request ID for payment updates", async () => {
    mockPaymentUpdate.mockResolvedValue(undefined);
    await updatePayment("g1", "p1", "m1", 1000, "Lunch", ["m1", "m2"]);
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      "g1",
      "p1",
      { payerMemberId: "m1", amount: 1000, description: "Lunch" },
      ["m1", "m2"]
    );
  });

  it("joins only with a valid invitation token", async () => {
    expect(await joinGroup("g1")).toEqual({
      success: false,
      error: "招待リンクが無効です",
    });
    mockGroupAddCollaborator.mockResolvedValue(undefined);
    expect(await joinGroup(invitationToken)).toEqual({ success: true });
    expect(mockGroupAddCollaborator).toHaveBeenCalledWith(invitationToken);
  });

  it("returns a newly issued token only after successful rotation", async () => {
    const rotated = "b".repeat(32);
    mockGroupRotateInvitation.mockResolvedValue(rotated);
    expect(await rotateInvitation("g1")).toEqual({
      success: true,
      data: rotated,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/group/g1");
  });

  it("returns the dashboard use-case result unchanged", async () => {
    const data = {
      group: { id: "g1", name: "Group", isRoughMode: false },
      members: [],
      payments: [],
      settlement: [],
      isCollaborator: true,
      isOwner: true,
      invitationToken,
      nextPaymentCursor: null,
    };
    mockDashboardExecute.mockResolvedValue(data);
    expect(await getGroupDashboardData("g1")).toEqual(data);
  });

  it("loads the next history page through the group repository", async () => {
    const cursor = { createdAt: "2026-10-20T00:00:00Z", id: "p1" };
    const page = { payments: [], nextCursor: null };
    mockGroupGetPaymentHistory.mockResolvedValue(page);
    expect(await getGroupPaymentHistory("g1", cursor)).toEqual(page);
    expect(mockGroupGetPaymentHistory).toHaveBeenCalledWith("g1", cursor);
  });
});
