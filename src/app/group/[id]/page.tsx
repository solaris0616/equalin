"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { use, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import {
  getGroupMembers,
  getGroupPayments,
  joinGroup,
} from "@/app/actions/payments";
import type {
  PaymentWithDetails,
  Profile,
} from "@/core/domain/entities/payment";
import { InviteLinkButton } from "./components/InviteLinkButton";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentList } from "./components/PaymentList";
import { SettlementDisplay } from "./components/SettlementDisplay";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const storageKey = `equalin_profile_${groupId}`;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [settlementRefreshTrigger, setSettlementRefreshTrigger] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadGroupData = async () => {
    setIsLoadingData(true);
    setRefreshError(null);
    try {
      const [fetchedMembers, fetchedPayments] = await Promise.all([
        getGroupMembers(groupId),
        getGroupPayments(groupId),
      ]);
      setMembers(fetchedMembers);
      setPayments(fetchedPayments);
      setSettlementRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading group data:", error);
      setRefreshError(
        "データの読み込みに失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!nameInput.trim()) {
      alert("名前を入力してください。");
      return;
    }

    const newProfile: Profile = { id: nanoid(), name: nameInput.trim() };
    const result = await joinGroup(groupId, newProfile);

    if (!result.success) {
      alert(result.error || "グループへの参加に失敗しました。");
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handlePaymentSuccess = async () => {
    await loadGroupData();
    setShowPaymentForm(false);
  };

  useEffect(() => {
    const loadProfileForGroup = () => {
      const localProfile = localStorage.getItem(storageKey);
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
      }
      setIsLoading(false);
    };
    loadProfileForGroup();
  }, [storageKey]);

  useEffect(() => {
    if (profile) {
      loadGroupData();
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f0]">
        <div className="pixel-card animate-pulse text-2xl font-bold">
          ロード中...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex justify-center items-center p-4">
        <div className="w-full max-w-sm p-8 space-y-6 pixel-card">
          <h2 className="text-3xl font-bold text-center text-black tracking-normal">
            パーティに参加する
          </h2>
          <div className="h-1 bg-black w-full" />
          <p className="text-center text-black font-bold">
            名前を入力してください
          </p>
          <div className="space-y-6">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="あなたの名前"
              className="w-full pixel-input"
            />
            <button
              type="button"
              onClick={handleJoinGroup}
              className="w-full pixel-button-primary text-xl"
            >
              決定
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="pixel-card">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-black tracking-normal uppercase">
                支出ログ
              </h1>
            </div>
            <InviteLinkButton groupId={groupId} />
          </div>
        </div>

        {refreshError && (
          <div
            className="bg-red-500 border-4 border-black text-white px-4 py-3 shadow-pixel flex items-start gap-3"
            role="alert"
          >
            <div className="flex-1 font-bold">
              <p>{refreshError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshError(null)}
              className="text-white hover:text-black font-bold"
              aria-label="閉じる"
            >
              [X]
            </button>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="w-full md:w-auto pixel-button-primary flex items-center justify-center gap-2 text-lg"
          >
            {showPaymentForm ? (
              <>
                <ChevronUp className="w-5 h-5" />
                入力を閉じる
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                支出を追加
              </>
            )}
          </button>

          {showPaymentForm && (
            <div className="mt-6">
              {isLoadingData ? (
                <div className="pixel-card text-center py-8">
                  <p className="text-black font-bold animate-pulse">メンバーを読み込み中...</p>
                </div>
              ) : (
                <PaymentForm
                  groupId={groupId}
                  currentUserId={profile.id}
                  members={members}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          )}
        </div>

        {isLoadingData ? (
          <div className="pixel-card text-center py-12">
            <p className="text-black font-bold animate-pulse">ログを読み込み中...</p>
          </div>
        ) : (
          <PaymentList
            payments={payments}
            groupId={groupId}
            onPaymentDeleted={loadGroupData}
          />
        )}

        <SettlementDisplay
          groupId={groupId}
          refreshTrigger={settlementRefreshTrigger}
        />
      </div>
    </div>
  );
}
