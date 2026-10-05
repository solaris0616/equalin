import { AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, mock } from "bun:test";

import { SupabaseAuthRepository } from "./SupabaseAuthRepository";

const getUser = mock();
mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
const repository = new SupabaseAuthRepository();
beforeEach(() => getUser.mockReset());

describe("auth identity errors", () => {
  it("returns the verified user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
    expect(await repository.getCurrentUser()).toEqual({ id: "user" });
  });
  it("allows a new visitor without a session", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    expect(await repository.getCurrentUser()).toBeNull();
  });
  it("does not replace an identity when the auth service fails", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Network failure"),
    });
    await expect(repository.getCurrentUser()).rejects.toThrow(
      "Network failure"
    );
  });
});
