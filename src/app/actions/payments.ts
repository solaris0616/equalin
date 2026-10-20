"use server";

import { revalidatePath } from "next/cache";

import type {
  Group,
  GroupDashboardData,
  Member,
  PaymentHistoryCursor,
  PaymentHistoryPage,
} from "@/core/domain/entities/payment";

import {
  groupRepository,
  paymentRepository,
  authRepository,
  groupDashboardUseCase,
} from "@/core/registry";

/**
 * グループ作成
 */
export async function createGroup(
  name: string,
  memberNames: string[]
): Promise<{
  success: boolean;
  data?: Group;
  error?: string;
}> {
  try {
    if (typeof name !== "string" || name.trim() === "" || name.length > 100) {
      return { success: false, error: "グループ名を入力してください" };
    }

    if (
      !Array.isArray(memberNames) ||
      memberNames.length > 100 ||
      memberNames.some((n) => typeof n !== "string" || n.length > 100)
    ) {
      return {
        success: false,
        error: "メンバーは100名以内、名前は100文字以内で入力してください",
      };
    }

    if (memberNames.filter((n) => n.trim() !== "").length < 2) {
      return { success: false, error: "メンバーを2名以上追加してください" };
    }

    // Get current user or sign in anonymously if not found
    let user = await authRepository.getCurrentUser();

    if (!user) {
      user = await authRepository.signInAnonymously();
    }

    if (!user) {
      return { success: false, error: "ユーザーの特定に失敗しました" };
    }

    const group = await groupRepository.create(
      name.trim(),
      user.id,
      memberNames.map((n) => n.trim()).filter(Boolean)
    );

    return { success: true, data: group };
  } catch (error: unknown) {
    console.error("Error in createGroup:", error);
    return { success: false, error: "グループの作成に失敗しました" };
  }
}

/**
 * 支払いの作成
 */
export async function createPayment(
  groupId: string,
  payerMemberId: string,
  amount: number,
  description: string,
  participantMemberIds: string[],
  clientRequestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (
      !Array.isArray(participantMemberIds) ||
      participantMemberIds.length === 0
    ) {
      return { success: false, error: "参加者を1人以上選択してください" };
    }

    if (
      typeof description !== "string" ||
      description.length > 1000 ||
      participantMemberIds.length > 100 ||
      participantMemberIds.some((id) => typeof id !== "string") ||
      new Set(participantMemberIds).size !== participantMemberIds.length
    ) {
      return { success: false, error: "支払い内容または参加者が不正です" };
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 999999999) {
      return { success: false, error: "有効な金額を入力してください" };
    }

    if (!isUuid(clientRequestId)) {
      return { success: false, error: "リクエストを再試行してください" };
    }

    await paymentRepository.create(
      { groupId, payerMemberId, amount, description: description || null },
      participantMemberIds,
      clientRequestId
    );

    revalidatePath(`/group/${groupId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in createPayment:", error);
    const message = "支払いの作成に失敗しました";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 支払いの更新
 */
export async function updatePayment(
  groupId: string,
  paymentId: string,
  payerMemberId: string,
  amount: number,
  description: string,
  participantMemberIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (
      !Array.isArray(participantMemberIds) ||
      participantMemberIds.length === 0
    ) {
      return { success: false, error: "参加者を1人以上選択してください" };
    }

    if (
      typeof description !== "string" ||
      description.length > 1000 ||
      participantMemberIds.length > 100 ||
      participantMemberIds.some((id) => typeof id !== "string") ||
      new Set(participantMemberIds).size !== participantMemberIds.length
    ) {
      return { success: false, error: "支払い内容または参加者が不正です" };
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 999999999) {
      return { success: false, error: "有効な金額を入力してください" };
    }

    await paymentRepository.update(
      groupId,
      paymentId,
      { payerMemberId, amount, description: description || null },
      participantMemberIds
    );

    revalidatePath(`/group/${groupId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in updatePayment:", error);
    const message = "支払いの更新に失敗しました";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * メンバーの追加
 */
export async function addMember(
  groupId: string,
  name: string
): Promise<{ success: boolean; data?: Member; error?: string }> {
  try {
    if (typeof name !== "string" || !name.trim() || name.length > 100) {
      return {
        success: false,
        error: "メンバー名は1〜100文字で入力してください",
      };
    }
    const member = await groupRepository.addMember(groupId, name.trim());
    revalidatePath(`/group/${groupId}`);
    return { success: true, data: member };
  } catch (error: unknown) {
    console.error("Error in addMember:", error);
    return { success: false, error: "メンバーの追加に失敗しました" };
  }
}

/**
 * メンバーの削除
 */
export async function deleteMember(
  groupId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await groupRepository.deleteMember(groupId, memberId);
    revalidatePath(`/group/${groupId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in deleteMember:", error);
    return { success: false, error: "メンバーの削除に失敗しました" };
  }
}

/**
 * グループに参加 (コラボレーターとして登録)
 */
export async function joinGroup(
  invitationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authRepository.getCurrentUser();

    if (!user) {
      return { success: false, error: "認証に失敗しました" };
    }

    if (!/^[a-f0-9]{32}$/.test(invitationToken)) {
      return { success: false, error: "招待リンクが無効です" };
    }

    await groupRepository.addCollaborator(invitationToken);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in joinGroup:", error);
    const message = "グループへの参加に失敗しました";
    return {
      success: false,
      error: message,
    };
  }
}

/** 招待リンクを再発行し、過去のリンクでの参加を無効化する。 */
export async function rotateInvitation(
  groupId: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const token = await groupRepository.rotateInvitationToken(groupId);
    revalidatePath(`/group/${groupId}`);
    return { success: true, data: token };
  } catch (error: unknown) {
    console.error("Error in rotateInvitation:", error);
    return { success: false, error: "招待リンクの再発行に失敗しました" };
  }
}

/**
 * 支払いの削除
 */
export async function deletePayment(
  groupId: string,
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await paymentRepository.delete(groupId, paymentId);
    revalidatePath(`/group/${groupId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in deletePayment:", error);
    const message = "削除に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * グループダッシュボードに必要な全てのデータを一括取得
 */
export async function getGroupDashboardData(
  groupId: string
): Promise<GroupDashboardData> {
  try {
    return await groupDashboardUseCase.execute(groupId);
  } catch (error) {
    console.error("Error in getGroupDashboardData:", error);
    return {
      error: "データの読み込みに失敗しました。再試行してください。",
      group: null,
      members: [],
      payments: [],
      settlement: [],
      isCollaborator: false,
      isOwner: false,
      invitationToken: null,
      nextPaymentCursor: null,
    };
  }
}

/** 次の履歴ページを取得する。精算値はダッシュボード初期応答の集計を使う。 */
export async function getGroupPaymentHistory(
  groupId: string,
  cursor: PaymentHistoryCursor | null
): Promise<PaymentHistoryPage> {
  try {
    return await groupRepository.getPaymentHistory(groupId, cursor);
  } catch (error) {
    console.error("Error in getGroupPaymentHistory:", error);
    throw new Error("履歴の読み込みに失敗しました");
  }
}

/**
 * ざっくりモード設定の更新
 *
 * オーナー検証と更新対象の存在確認はDB関数内で行う。
 */
export async function updateRoughMode(
  groupId: string,
  isRoughMode: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authRepository.getCurrentUser();
    if (!user) {
      return { success: false, error: "認証に失敗しました" };
    }

    await groupRepository.updateRoughMode(groupId, isRoughMode);
    revalidatePath(`/group/${groupId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in updateRoughMode:", error);
    return { success: false, error: "設定の更新に失敗しました" };
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}
