"use client";

import { ChevronDown, ChevronUp, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type {
  GroupDashboardData,
  Member,
  PaymentWithDetails,
  SettlementTransaction,
} from "@/core/domain/entities/payment";

import {
  addMember,
  deleteMember,
  getGroupDashboardData,
  joinGroup,
} from "@/app/actions/payments";
import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { InviteLinkButton } from "./components/InviteLinkButton";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentList } from "./components/PaymentList";
import { SettlementDisplay } from "./components/SettlementDisplay";

interface GroupClientPageProps {
  groupId: string;
  initialData: GroupDashboardData;
}

export default function GroupClientPage({
  groupId,
  initialData,
}: GroupClientPageProps) {
  const supabase = createClient();

  const [isCollaborator, setIsCollaborator] = useState<boolean>(
    initialData.isCollaborator
  );
  const [isOwner, setIsOwner] = useState(initialData.isOwner);
  const [group, setGroup] = useState(initialData.group);
  const [members, setMembers] = useState<Member[]>(initialData.members);
  const [payments, setPayments] = useState<PaymentWithDetails[]>(
    initialData.payments
  );
  const [settlement, setSettlement] = useState<SettlementTransaction[]>(
    initialData.settlement
  );

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<PaymentWithDetails | null>(null);

  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);

  useEffect(() => {
    const themeClass = isCollaborator ? "bg-form-theme" : "bg-landing-theme";
    document.body.classList.add(themeClass);

    return () => {
      document.body.classList.remove("bg-form-theme", "bg-landing-theme");
    };
  }, [isCollaborator]);

  const refreshData = useCallback(async () => {
    const data = await getGroupDashboardData(groupId);
    setGroup(data.group);
    setMembers(data.members);
    setPayments(data.payments);
    setSettlement(data.settlement);
    setIsCollaborator(data.isCollaborator);
    setIsOwner(data.isOwner);
  }, [groupId]);

  const handleJoinGroup = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      const result = await joinGroup(groupId);

      if (!result.success) {
        alert(result.error || "グループへの参加に失敗しました。");
        return;
      }

      await refreshData();
    } catch (error) {
      console.error("Error joining group:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || isAddingMember) return;

    setIsAddingMember(true);
    try {
      const result = await addMember(groupId, newMemberName.trim());
      if (result.success) {
        setNewMemberName("");
        await refreshData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (members.length <= 2) {
      alert("グループには最低2名のメンバーが必要です。");
      return;
    }

    if (
      !confirm(
        "このメンバーを削除しますか？関連する支払いも削除される可能性があります。"
      )
    )
      return;

    try {
      const result = await deleteMember(groupId, memberId);
      if (result.success) {
        await refreshData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const handlePaymentSuccess = async () => {
    await refreshData();
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  const handleEditPayment = (payment: PaymentWithDetails) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isCollaborator) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <BackgroundImage src="/landing-bg.webp" priority />
        <div className="relative max-w-md w-full text-center mb-12">
          <h1 className="text-6xl font-bold text-black mb-2 tracking-normal [text-shadow:_2px_2px_0_white,_-2px_2px_0_white,_2px_-2px_0_white,_-2px_-2px_0_white]">
            パリカン
          </h1>
          <p className="text-lg font-bold text-black [text-shadow:_1px_1px_0_white,_-1px_1px_0_white,_1px_-1px_0_white,_-1px_-1px_0_white]">
            パッと割り勘しよう
          </p>
        </div>

        <div className="w-full max-w-md p-10 space-y-4 pixel-card text-center relative z-10 bg-white">
          <h2 className="text-3xl font-bold text-black tracking-tighter mb-6">
            {group?.name || "グループ"}に参加
          </h2>
          <p className="text-lg text-black font-bold mb-8">
            グループに参加して支出を記録しましょう
          </p>
          <Button
            onClick={handleJoinGroup}
            className="w-full text-xl py-6 h-14 tracking-widest mt-8"
          >
            参加する
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-24 font-sans">
      <BackgroundImage src="/form-bg.webp" />
      <div className="max-w-4xl mx-auto space-y-4 relative z-10">
        <div className="pixel-card bg-white">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-black tracking-normal uppercase">
                {group?.name || "支出ログ"}
              </h1>
            </div>
            <InviteLinkButton groupId={groupId} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isOwner && (
            <Button
              onClick={() => setShowMemberManager(!showMemberManager)}
              variant="green"
              disabled={showPaymentForm}
              className="flex items-center justify-center gap-2 h-14 text-base w-full"
            >
              {showMemberManager ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  閉じる
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  メンバー
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            disabled={showMemberManager}
            className={cn(
              "flex items-center justify-center gap-2 h-14 text-base w-full",
              !isOwner && "col-span-2"
            )}
          >
            {showPaymentForm ? (
              <>
                <ChevronUp className="w-5 h-5" />
                閉じる
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                支出を追加
              </>
            )}
          </Button>
        </div>

        {showMemberManager && (
          <div className="pixel-card bg-yellow-50">
            <h2 className="text-xl font-bold mb-4">メンバー編集</h2>
            <div className="space-y-4">
              {isOwner && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="メンバー名を入力"
                    className="flex-1 min-w-0 border-4 border-black p-3 text-base font-bold focus:outline-none bg-white focus:bg-yellow-50 h-[60px]"
                  />
                  <Button
                    onClick={handleAddMember}
                    isLoading={isAddingMember}
                    variant="green"
                    className="w-14 h-[54px]"
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 bg-white border-4 border-black px-4 py-2 text-base font-bold"
                  >
                    <span>{m.name}</span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-red-500 font-bold hover:text-red-700 text-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showPaymentForm && (
          <div className="mt-6">
            <PaymentForm
              groupId={groupId}
              members={members}
              initialData={editingPayment || undefined}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPaymentForm(false);
                setEditingPayment(null);
              }}
            />
          </div>
        )}

        <SettlementDisplay
          groupId={groupId}
          initialTransactions={settlement}
          // We can remove refreshTrigger as we manage state here or pass it if needed
        />

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowPayments(!showPayments)}
            className="w-full flex items-center justify-center gap-2 h-14 text-base"
          >
            {showPayments ? (
              <>
                <ChevronUp className="w-5 h-5" />
                閉じる
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                履歴を表示
              </>
            )}
          </Button>

          {showPayments && (
            <PaymentList
              payments={payments}
              groupId={groupId}
              isOwner={isOwner}
              onPaymentDeleted={refreshData}
              onEdit={handleEditPayment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
