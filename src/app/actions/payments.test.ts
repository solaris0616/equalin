import { describe, expect, it, mock, beforeEach } from "bun:test";
import { deleteMember, createGroup } from "./payments";
import { groupRepository } from "@/core/registry";

// Mock groupRepository
mock.module("@/core/registry", () => ({
  groupRepository: {
    getMembers: mock(),
    deleteMember: mock(),
    create: mock(),
    addMember: mock(),
    addCollaborator: mock(),
  },
  paymentRepository: {},
  settlementUseCase: {},
}));

// Mock supabase server client
mock.module("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user1" } } }),
      signInAnonymously: () => Promise.resolve({ data: { user: { id: "user1" } } }),
    },
  }),
}));

// Mock next/cache
mock.module("next/cache", () => ({
  revalidatePath: mock(),
}));

describe("payments actions", () => {
  beforeEach(() => {
    mock.restore();
  });

  describe("deleteMember", () => {
    it("should fail if group has 2 or fewer members", async () => {
      const mockMembers = [
        { id: "m1", name: "Alice", groupId: "g1" },
        { id: "m2", name: "Bob", groupId: "g1" },
      ];
      (groupRepository.getMembers as any).mockResolvedValue(mockMembers);

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("グループには最低2名のメンバーが必要です。");
      expect(groupRepository.deleteMember).not.toHaveBeenCalled();
    });

    it("should succeed if group has more than 2 members", async () => {
      const mockMembers = [
        { id: "m1", name: "Alice", groupId: "g1" },
        { id: "m2", name: "Bob", groupId: "g1" },
        { id: "m3", name: "Charlie", groupId: "g1" },
      ];
      (groupRepository.getMembers as any).mockResolvedValue(mockMembers);
      (groupRepository.deleteMember as any).mockResolvedValue(undefined);

      const result = await deleteMember("g1", "m1");

      expect(result.success).toBe(true);
      expect(groupRepository.deleteMember).toHaveBeenCalledWith("m1");
    });
  });

  describe("createGroup", () => {
    it("should fail if less than 2 members are provided", async () => {
      const result = await createGroup("Test Group", ["Alice"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーを2名以上追加してください");
      expect(groupRepository.create).not.toHaveBeenCalled();
    });

    it("should succeed if 2 or more members are provided", async () => {
      (groupRepository.create as any).mockResolvedValue({ id: "g1", name: "Test Group" });
      (groupRepository.addMember as any).mockResolvedValue({});

      const result = await createGroup("Test Group", ["Alice", "Bob"]);

      expect(result.success).toBe(true);
      expect(groupRepository.create).toHaveBeenCalled();
      expect(groupRepository.addMember).toHaveBeenCalledTimes(2);
    });

    it("should ignore empty member names and fail if remaining members < 2", async () => {
      const result = await createGroup("Test Group", ["Alice", " ", ""]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("メンバーを2名以上追加してください");
    });
  });
});
