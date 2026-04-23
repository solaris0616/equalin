'use server';

import type {
  Group,
  PaymentWithDetails,
  Profile,
  SettlementTransaction,
} from '@/core/domain/entities/payment';
import {
  groupRepository,
  paymentRepository,
  profileRepository,
  settlementUseCase,
} from '@/core/registry';
import { createClient } from '@/lib/supabase/server';

/**
 * グループ作成
 */
export async function createGroup(): Promise<{
  success: boolean;
  data?: Group;
  error?: string;
}> {
  try {
    const group = await groupRepository.create();
    return { success: true, data: group };
  } catch (error: unknown) {
    console.error('Error in createGroup:', error);
    return { success: false, error: 'グループの作成に失敗しました' };
  }
}

/**
 * 支払いの作成
 */
export async function createPayment(
  groupId: string,
  payerId: string,
  amount: number,
  description: string,
  participantIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    if (participantIds.length === 0) {
      return { success: false, error: '参加者を1人以上選択してください' };
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 999999999) {
      return { success: false, error: '有効な金額を入力してください' };
    }

    await paymentRepository.create(
      { groupId, payerId, amount, description: description || null },
      participantIds,
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createPayment:', error);
    const message =
      error instanceof Error ? error.message : '支払いの作成に失敗しました';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * グループの支払い履歴取得
 */
export async function getGroupPayments(
  groupId: string,
): Promise<PaymentWithDetails[]> {
  try {
    return await paymentRepository.getByGroupId(groupId);
  } catch (error: unknown) {
    console.error('Error in getGroupPayments:', error);
    return [];
  }
}

/**
 * グループメンバー取得
 */
export async function getGroupMembers(groupId: string): Promise<Profile[]> {
  try {
    return await groupRepository.getMembers(groupId);
  } catch (error: unknown) {
    console.error('Error in getGroupMembers:', error);
    return [];
  }
}

/**
 * グループに参加
 */
export async function joinGroup(
  groupId: string,
  name: string,
): Promise<{ success: boolean; data?: Profile; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '認証に失敗しました' };
    }

    const profile: Profile = { id: user.id, name };

    // 1. プロフィール作成 (既に存在する場合は無視するか更新する設計に)
    await profileRepository.create(profile);
    // 2. グループメンバー追加
    await groupRepository.addMember(groupId, profile.id);

    return { success: true, data: profile };
  } catch (error: unknown) {
    console.error('Error in joinGroup:', error);
    const message =
      error instanceof Error ? error.message : 'グループへの参加に失敗しました';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 支払いの削除
 */
export async function deletePayment(
  paymentId: string,
  groupId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await paymentRepository.delete(paymentId, groupId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deletePayment:', error);
    const message =
      error instanceof Error ? error.message : '削除に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * 精算の計算
 */
export async function calculateSettlement(
  groupId: string,
): Promise<SettlementTransaction[]> {
  try {
    return await settlementUseCase.execute(groupId);
  } catch (error: unknown) {
    console.error('Error in calculateSettlement:', error);
    return [];
  }
}
