'use client';

import { useEffect, useState } from 'react';
import { createPayment, updatePayment } from '@/app/actions/payments';
import type {
  PaymentWithParticipants,
  Profile,
} from '@/core/domain/entities/payment';
import { cn } from '@/lib/utils';

interface PaymentFormProps {
  groupId: string;
  currentUserId: string;
  members: Profile[];
  initialData?: PaymentWithParticipants & { description: string | null };
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  groupId,
  currentUserId,
  members,
  initialData,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [description, setDescription] = useState(
    initialData?.description || '',
  );
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(initialData?.participantIds || members.map((m) => m.id)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form if initialData changes (e.g. when switching between edits)
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setAmount(initialData.amount.toString());
      setSelectedParticipants(new Set(initialData.participantIds));
    }
  }, [initialData]);

  const handleParticipantToggle = (profileId: string) => {
    setSelectedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountValue = Number.parseInt(amount, 10);
    if (Number.isNaN(amountValue) || amountValue < 1) {
      setError('有効な金額を入力してください（最小値：1）');
      return;
    }

    if (selectedParticipants.size === 0) {
      setError('少なくとも1人の参加者を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      let result: { success: boolean; error?: string };
      if (initialData) {
        result = await updatePayment(
          initialData.id,
          initialData.payerId, // Keep original payer for now
          amountValue,
          description,
          Array.from(selectedParticipants),
        );
      } else {
        result = await createPayment(
          groupId,
          currentUserId,
          amountValue,
          description,
          Array.from(selectedParticipants),
        );
      }

      if (result.success) {
        if (!initialData) {
          setDescription('');
          setAmount('');
          setSelectedParticipants(new Set(members.map((m) => m.id)));
        }
        setError(null);
        onSuccess();
      } else {
        setError(
          result.error ||
            (initialData ? '更新に失敗しました' : '支払いの作成に失敗しました'),
        );
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pixel-card">
      <h2 className="text-2xl font-bold text-black uppercase tracking-normal">
        {initialData ? '支出の編集' : '支出の入力'}
      </h2>
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
          className="w-full pixel-input"
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
          className="w-full pixel-input"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-bold text-black">
          誰の分ですか？ *
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
                'flex items-center space-x-3 p-2 cursor-pointer transition-all border-2 border-transparent',
                selectedParticipants.has(member.id)
                  ? 'bg-blue-100 border-black'
                  : 'hover:bg-gray-100',
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
        <p className="text-xs font-bold text-gray-500">
          {members.length}人中 {selectedParticipants.size}人 選択
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500 border-4 border-black text-white font-bold">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        {initialData && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full md:w-1/3 pixel-button bg-gray-200 text-black text-xl uppercase"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex-1 pixel-button-primary text-xl uppercase',
            isSubmitting && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isSubmitting
            ? initialData
              ? '更新中...'
              : '記録中...'
            : initialData
              ? '更新する'
              : '記録する'}
        </button>
      </div>
    </form>
  );
}
