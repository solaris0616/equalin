import { nanoid } from "nanoid";

import type {
  Group,
  GroupDashboardSnapshot,
  Member,
  MemberBalance,
  PaymentHistoryCursor,
  PaymentHistoryPage,
  PaymentWithDetails,
} from "@/core/domain/entities/payment";
import type { IGroupRepository } from "@/core/domain/repositories";

import { createClient } from "@/lib/supabase/server";

type GroupRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  is_rough_mode: boolean;
};
type MemberRow = { id: string; group_id: string; name: string };
type PaymentRow = {
  id: string;
  group_id: string;
  payer_member_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  payer: { name: string };
  participants: { member_id: string; member: { name: string } }[];
};
type DashboardRow = {
  group: { id: string; name: string; is_rough_mode: boolean };
  members: MemberRow[];
  payments: PaymentRow[];
  balances: BalanceRow[];
  invite_token: string;
  next_payment_cursor: CursorRow | null;
};
type BalanceRow = {
  member_id: string;
  name: string;
  paid: number;
  owed: number;
  balance: number;
};
type CursorRow = { created_at: string; id: string };
type PaymentHistoryRow = {
  payments: PaymentRow[];
  next_cursor: CursorRow | null;
};

export class SupabaseGroupRepository implements IGroupRepository {
  async create(
    name: string,
    _ownerId: string,
    memberNames: string[]
  ): Promise<Group> {
    const id = nanoid();
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("create_group", {
        p_id: id,
        p_name: name,
        p_member_names: memberNames,
      })
      .single<GroupRow>();

    if (error) throw new Error(error.message);

    const invitationToken = await this.getInvitationToken(id);

    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      isRoughMode: data.is_rough_mode,
      invitationToken: invitationToken || undefined,
    };
  }

  async getDashboardSnapshot(
    groupId: string
  ): Promise<GroupDashboardSnapshot | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_group_dashboard", {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);
    if (!isDashboardRow(data)) return null;

    return {
      group: {
        id: data.group.id,
        name: data.group.name,
        isRoughMode: data.group.is_rough_mode,
      },
      members: data.members.map((member) => ({
        id: member.id,
        groupId: member.group_id,
        name: member.name,
      })),
      payments: data.payments.map(mapPayment),
      balances: data.balances.map(mapBalance),
      invitationToken: data.invite_token,
      nextPaymentCursor: mapCursor(data.next_payment_cursor),
    };
  }

  async getPaymentHistory(
    groupId: string,
    cursor: PaymentHistoryCursor | null
  ): Promise<PaymentHistoryPage> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_group_payment_history", {
      p_group_id: groupId,
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
    });
    if (error) throw new Error(error.message);
    if (!isPaymentHistoryRow(data))
      throw new Error("Invalid payment history response");

    return {
      payments: data.payments.map(mapPayment),
      nextCursor: mapCursor(data.next_cursor),
    };
  }

  async getInvitationToken(groupId: string): Promise<string | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_group_invitation", {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);
    return typeof data === "string" ? data : null;
  }

  async rotateInvitationToken(groupId: string): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rotate_group_invitation", {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);
    if (typeof data !== "string")
      throw new Error("Invalid invitation response");
    return data;
  }

  async getById(id: string): Promise<Group | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_group_by_link", { p_group_id: id })
      .maybeSingle<GroupRow>();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      isRoughMode: data.is_rough_mode,
    };
  }

  async addMember(groupId: string, name: string): Promise<Member> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("add_group_member", { p_group_id: groupId, p_name: name })
      .single<MemberRow>();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      groupId: data.group_id,
      name: data.name,
    };
  }

  async deleteMember(groupId: string, memberId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_group_member", {
      p_group_id: groupId,
      p_member_id: memberId,
    });

    if (error) throw new Error(error.message);
  }

  async addCollaborator(invitationToken: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("join_group", {
      p_invite_token: invitationToken,
    });

    if (error) throw new Error(error.message);
  }

  async updateRoughMode(groupId: string, isRoughMode: boolean): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_rough_mode", {
      p_group_id: groupId,
      p_enabled: isRoughMode,
    });

    if (error) throw new Error(error.message);
  }
}

function mapPayment(payment: PaymentRow): PaymentWithDetails {
  return {
    id: payment.id,
    groupId: payment.group_id,
    payerMemberId: payment.payer_member_id,
    amount: payment.amount,
    description: payment.description,
    createdAt: payment.created_at,
    payerName: payment.payer.name,
    participantNames: payment.participants.map(
      (participant) => participant.member.name
    ),
    participantMemberIds: payment.participants.map(
      (participant) => participant.member_id
    ),
  };
}

function mapBalance(balance: BalanceRow): MemberBalance {
  return {
    memberId: balance.member_id,
    name: balance.name,
    paid: balance.paid,
    owed: balance.owed,
    balance: balance.balance,
  };
}

function mapCursor(cursor: CursorRow | null): PaymentHistoryCursor | null {
  return cursor ? { createdAt: cursor.created_at, id: cursor.id } : null;
}

function isDashboardRow(value: unknown): value is DashboardRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<DashboardRow>;
  return (
    !!row.group &&
    typeof row.group.id === "string" &&
    typeof row.group.name === "string" &&
    typeof row.group.is_rough_mode === "boolean" &&
    Array.isArray(row.members) &&
    Array.isArray(row.payments) &&
    Array.isArray(row.balances) &&
    typeof row.invite_token === "string"
  );
}

function isPaymentHistoryRow(value: unknown): value is PaymentHistoryRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<PaymentHistoryRow>;
  return (
    Array.isArray(row.payments) &&
    (row.next_cursor === null || isCursorRow(row.next_cursor))
  );
}

function isCursorRow(value: unknown): value is CursorRow {
  if (!value || typeof value !== "object") return false;
  const cursor = value as Partial<CursorRow>;
  return typeof cursor.created_at === "string" && typeof cursor.id === "string";
}
