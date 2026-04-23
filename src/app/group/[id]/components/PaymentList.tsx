'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deletePayment } from '@/app/actions/payments';
import type { PaymentWithDetails } from '@/core/domain/entities/payment';

interface PaymentListProps {
  payments: PaymentWithDetails[];
  groupId: string;
  currentUserId: string;
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
  currentUserId,
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
      <div className="pixel-card text-center py-12">
        <p className="text-gray-500 text-xl font-bold italic uppercase">
          ログがありません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black uppercase tracking-normal">
        履歴
      </h2>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="pixel-card border-l-[12px] border-l-blue-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  支払った人
                </p>
                <p className="text-xl font-bold text-black uppercase">
                  {payment.payerName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 tracking-tighter">
                    ¥{payment.amount.toLocaleString()}
                  </p>
                </div>
                {payment.payerId === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(payment.id)}
                    disabled={deletingId === payment.id}
                    aria-label="Delete payment"
                    className="pixel-button bg-red-500 text-white p-2"
                    title="Delete payment"
                  >
                    {deletingId === payment.id ? (
                      <div className="w-5 h-5 border-4 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {payment.description && (
              <div className="mb-4 p-2 bg-gray-50 border-2 border-dashed border-black">
                <p className="text-black font-bold">{payment.description}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
                一緒にいた人
              </p>
              <div className="flex flex-wrap gap-2">
                {payment.participantNames.map((name, index) => (
                  <span
                    key={`${payment.id}-participant-${index}`}
                    className="inline-block px-2 py-1 text-xs font-bold bg-gray-200 border-2 border-black"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t-2 border-black border-dotted">
              <p className="text-xs font-bold text-gray-400">
                記録日: {formatTimestamp(payment.createdAt).toUpperCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
