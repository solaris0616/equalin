'use client';

import { useState } from 'react';
import { createPayment } from '@/app/actions/payments';
import { cn } from '@/lib/utils';
import type { Profile } from '@/src/domain/entities/payment';

interface PaymentFormProps {
  groupId: string;
  currentUserId: string;
  members: Profile[];
  onSuccess: () => void;
}

export function PaymentForm({
  groupId,
  currentUserId,
  members,
  onSuccess,
}: PaymentFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(members.map((m) => m.id)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await createPayment(
        groupId,
        currentUserId,
        amountValue,
        description,
        Array.from(selectedParticipants),
      );

      if (result.success) {
        setDescription('');
        setAmount('');
        setSelectedParticipants(new Set(members.map((m) => m.id)));
        setError(null);
        onSuccess();
      } else {
        setError(result.error || '支払いの作成に失敗しました');
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold text-gray-900">支払いを追加</h2>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          説明（任意）
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：レストランでの夕食"
          className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          金額 *
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
          className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">
          参加者 *
        </span>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50" role="group" aria-label="参加者選択">
          {members.map((member) => (
            <label
              key={member.id}
              className={cn(
                'flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-100 transition',
                selectedParticipants.has(member.id) && 'bg-blue-50',
              )}
            >
              <input
                type="checkbox"
                checked={selectedParticipants.has(member.id)}
                onChange={() => handleParticipantToggle(member.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-900">{member.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {members.length}人中{selectedParticipants.size}人選択
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full py-3 px-6 font-bold text-white rounded-lg transition focus:outline-none focus:ring-4',
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
        )}
      >
        {isSubmitting ? '支払いを作成中...' : '支払いを作成'}
      </button>
    </form>
  );
}
