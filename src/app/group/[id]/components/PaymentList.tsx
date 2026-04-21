'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deletePayment } from '@/app/actions/payments';
import type { PaymentWithDetails } from '@/core/domain/entities/payment';

interface PaymentListProps {
  payments: PaymentWithDetails[];
  groupId: string;
  onPaymentDeleted: () => void;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PaymentList({
  payments,
  groupId,
  onPaymentDeleted,
}: PaymentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (paymentId: string) => {
    const confirmed = window.confirm(
      'この支払いを削除してもよろしいですか？この操作は元に戻せません。',
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(paymentId);

    try {
      const result = await deletePayment(paymentId, groupId);

      if (result.success) {
        onPaymentDeleted();
      } else {
        alert(result.error || '支払いの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('予期しないエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500 text-lg">
          まだ支払いがありません。最初の支払いを追加しましょう！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">支払い履歴</h2>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500">支払者</p>
                <p className="text-lg font-bold text-gray-900">
                  {payment.payerName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{payment.amount.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(payment.id)}
                  disabled={deletingId === payment.id}
                  aria-label="Delete payment"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete payment"
                >
                  {deletingId === payment.id ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {payment.description && (
              <div className="mb-3">
                <p className="text-gray-700">{payment.description}</p>
              </div>
            )}

            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">参加者</p>
              <div className="flex flex-wrap gap-2">
                {payment.participantNames.map((name, index) => (
                  <span
                    key={`${payment.id}-participant-${index}`}
                    className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                {formatTimestamp(payment.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
