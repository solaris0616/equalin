import { describe, expect, it, mock } from "bun:test";

import type {
  IGroupRepository,
  IPaymentRepository,
} from "@/core/domain/repositories";

import { SettlementUseCase } from "./SettlementUseCase";

describe("SettlementUseCase", () => {
  it("should return empty transactions if there are no payments", async () => {
    const mockGroupRepo = {
      getMembers: mock().mockResolvedValue([
        { id: "m1", name: "Alice", groupId: "g1" },
        { id: "m2", name: "Bob", groupId: "g1" },
      ]),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockResolvedValue([]),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    const result = await useCase.execute("g1");

    expect(result).toEqual([]);
    expect(mockGroupRepo.getMembers).toHaveBeenCalledWith("g1");
    expect(mockPaymentRepo.getWithParticipantsByGroupId).toHaveBeenCalledWith(
      "g1"
    );
  });

  it("should calculate settlements correctly by calling SettlementService with members and payments", async () => {
    const mockMembers = [
      { id: "m1", name: "Alice", groupId: "g1" },
      { id: "m2", name: "Bob", groupId: "g1" },
    ];
    const mockPayments = [
      {
        id: "p1",
        groupId: "g1",
        payerMemberId: "m1",
        amount: 1000,
        description: "Lunch",
        createdAt: new Date(),
        participantMemberIds: ["m1", "m2"],
      },
    ];

    const mockGroupRepo = {
      getMembers: mock().mockResolvedValue(mockMembers),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockResolvedValue(mockPayments),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    const result = await useCase.execute("g1");

    // 1000 yen paid by Alice (m1) split between Alice and Bob (m2).
    // Bob should pay 500 yen to Alice.
    expect(result).toEqual([
      {
        fromId: "m2",
        fromName: "Bob",
        toId: "m1",
        toName: "Alice",
        amount: 500,
      },
    ]);
    expect(mockGroupRepo.getMembers).toHaveBeenCalledWith("g1");
    expect(mockPaymentRepo.getWithParticipantsByGroupId).toHaveBeenCalledWith(
      "g1"
    );
  });

  // Boundary Case: Empty members & empty payments
  it("should return empty if both members and payments are empty", async () => {
    const mockGroupRepo = {
      getMembers: mock().mockResolvedValue([]),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockResolvedValue([]),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    const result = await useCase.execute("g1");

    expect(result).toEqual([]);
  });

  // Boundary Case: Only 1 member with 1 payment (no split bill needed)
  it("should return empty transactions if there is only 1 member in the group", async () => {
    const mockMembers = [{ id: "m1", name: "Alice", groupId: "g1" }];
    const mockPayments = [
      {
        id: "p1",
        groupId: "g1",
        payerMemberId: "m1",
        amount: 1000,
        description: "Solo payment",
        createdAt: new Date(),
        participantMemberIds: ["m1"],
      },
    ];

    const mockGroupRepo = {
      getMembers: mock().mockResolvedValue(mockMembers),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockResolvedValue(mockPayments),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    const result = await useCase.execute("g1");

    expect(result).toEqual([]);
  });

  // Exceptional Case: groupRepo fails (should propagate error)
  it("should propagate error if groupRepo.getMembers fails", async () => {
    const mockGroupRepo = {
      getMembers: mock().mockRejectedValue(new Error("Database error")),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockResolvedValue([]),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    expect(useCase.execute("g1")).rejects.toThrow("Database error");
  });

  // Exceptional Case: paymentRepo fails (should propagate error)
  it("should propagate error if paymentRepo.getWithParticipantsByGroupId fails", async () => {
    const mockGroupRepo = {
      getMembers: mock().mockResolvedValue([
        { id: "m1", name: "Alice", groupId: "g1" },
      ]),
    } as unknown as IGroupRepository;

    const mockPaymentRepo = {
      getWithParticipantsByGroupId: mock().mockRejectedValue(
        new Error("Network timeout")
      ),
    } as unknown as IPaymentRepository;

    const useCase = new SettlementUseCase(mockGroupRepo, mockPaymentRepo);

    expect(useCase.execute("g1")).rejects.toThrow("Network timeout");
  });
});
