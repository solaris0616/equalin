"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { use, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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

    const newProfile: Profile = { id: uuidv4(), name: nameInput.trim() };
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
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            このグループに参加
          </h2>
          <p className="text-center text-gray-600">
            このグループでの名前を設定してください。
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="あなたの名前"
              className="w-full px-4 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleJoinGroup}
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              参加
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                グループの支出
              </h1>
              <p className="text-gray-600">ようこそ、{profile.name}さん！</p>
            </div>
            <InviteLinkButton groupId={groupId} />
          </div>
        </div>

        {refreshError && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3"
            role="alert"
          >
            <div className="flex-1">
              <p className="font-medium">{refreshError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshError(null)}
              className="text-red-600 hover:text-red-800 focus:outline-none"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="w-full md:w-auto px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition flex items-center justify-center gap-2"
          >
            {showPaymentForm ? (
              <>
                <ChevronUp className="w-5 h-5" />
                支払いフォームを非表示
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                支払いを追加
              </>
            )}
          </button>

          {showPaymentForm && (
            <div className="mt-4">
              {isLoadingData ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-600">メンバーを読み込み中...</p>
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

        <SettlementDisplay
          groupId={groupId}
          refreshTrigger={settlementRefreshTrigger}
        />

        {isLoadingData ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">支払いを読み込み中...</p>
          </div>
        ) : (
          <PaymentList
            payments={payments}
            groupId={groupId}
            onPaymentDeleted={loadGroupData}
          />
        )}
      </div>
    </div>
  );
}
