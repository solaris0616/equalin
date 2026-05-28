"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  Member,
  PaymentWithDetails,
} from "@/core/domain/entities/payment";

import {
  createPayment,
  updatePayment,
  getPaymentWithParticipants,
} from "@/app/actions/payments";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  groupId: string;
  groupName: string;
  members: Member[];
  initialData?: PaymentWithDetails;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  groupId,
  groupName,
  members,
  initialData,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [amount, setAmount] = useState(
    initialData?.amount.toLocaleString().replace(/,/g, "") || ""
  );
  const [payerMemberId, setPayerMemberId] = useState<string>(
    initialData?.payerMemberId || members[0]?.id || ""
  );
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(initialData ? [] : members.map((m) => m.id))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full participant IDs if editing
  useEffect(() => {
    const fetchParticipants = async () => {
      if (initialData) {
        const fullPayment = await getPaymentWithParticipants(initialData.id);
        if (fullPayment) {
          setSelectedParticipants(new Set(fullPayment.participantMemberIds));
        }
      }
    };
    fetchParticipants();
  }, [initialData]);

  const handleParticipantToggle = (memberId: string) => {
    setSelectedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountValue = Number.parseInt(amount, 10);
    if (Number.isNaN(amountValue) || amountValue < 1) {
      setError("有効な金額を入力してください");
      return;
    }

    if (!payerMemberId) {
      setError("支払った人を選択してください");
      return;
    }

    if (selectedParticipants.size === 0) {
      setError("少なくとも1人の参加者を選択してください");
      return;
    }

    // Prevent redundant split-bill (only payer is in participants)
    if (
      selectedParticipants.size === 1 &&
      selectedParticipants.has(payerMemberId)
    ) {
      setError(
        "自分一人だけの支払いは登録できません（割り勘メンバーを選択してください）"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (initialData) {
        result = await updatePayment(
          groupId,
          initialData.id,
          payerMemberId,
          amountValue,
          description,
          Array.from(selectedParticipants)
        );
      } else {
        result = await createPayment(
          groupId,
          payerMemberId,
          amountValue,
          description,
          Array.from(selectedParticipants)
        );
      }

      if (result.success) {
        if (!initialData) {
          setDescription("");
          setAmount("");
        }
        setError(null);
        onSuccess();
      } else {
        setError(result.error || "保存に失敗しました");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting payment:", err);
      setError("予期しないエラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pixel-card bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black uppercase tracking-normal">
          {initialData ? "支出の編集" : "支出の入力"}
        </h2>
        <span className="text-sm font-bold bg-black text-white px-2 py-1">
          {groupName}
        </span>
      </div>
      <div className="h-1 bg-black w-full" />

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-bold text-black"
        >
          何に使いましたか？
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：食事"
          className="w-full pixel-input h-[60px]"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="block text-sm font-bold text-black">
          いくら使いましたか？ *
        </label>
        <input
          id="amount"
          type="number"
          step="1"
          min="1"
          max="999999999"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full pixel-input h-[60px]"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-black">
          誰が支払いましたか？ *
        </label>
        <div className="relative">
          <select
            value={payerMemberId}
            onChange={(e) => setPayerMemberId(e.target.value)}
            className="w-full pixel-input bg-white h-[60px] appearance-none pr-10 rounded-none"
            disabled={isSubmitting}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <ChevronDown className="h-6 w-6 text-black stroke-[3]" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-bold text-black">
          誰と割りますか？ *
        </span>
        <div
          className="space-y-2 max-h-48 overflow-y-auto border-4 border-black p-3 bg-white"
          role="group"
          aria-label="参加者選択"
        >
          {members.map((member) => (
            <label
              key={member.id}
              className={cn(
                "flex items-center space-x-3 p-2 cursor-pointer transition-all border-2 border-transparent",
                selectedParticipants.has(member.id)
                  ? "bg-blue-100 border-black"
                  : "hover:bg-gray-100"
              )}
            >
              <input
                type="checkbox"
                checked={selectedParticipants.has(member.id)}
                onChange={() => handleParticipantToggle(member.id)}
                className="w-6 h-6 border-4 border-black text-blue-500 focus:ring-0 rounded-none appearance-none checked:bg-blue-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:font-bold checked:after:left-1 checked:after:top-[-4px]"
                disabled={isSubmitting}
              />
              <span className="text-sm font-bold text-black">
                {member.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500 border-4 border-black text-white font-bold">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 text-xl"
          >
            キャンセル
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="記録中..."
          className="flex-1 text-xl"
        >
          {initialData ? "保存する" : "記録する"}
        </Button>
      </div>
    </form>
  );
}
