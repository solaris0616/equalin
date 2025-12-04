'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { PaymentWithDetails } from '@/types/payment';
import { deletePayment } from '@/app/actions/payments';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PaymentListProps {
  payments: PaymentWithDetails[];
  groupId: string;
  onPaymentDeleted: () => void;
}

/**
 * Formats a timestamp into a readable date and time string.
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Dec 3, 2025 at 10:30 AM")
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function PaymentList({ payments, groupId, onPaymentDeleted }: PaymentListProps) {
  const { t } = useLanguage();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (paymentId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(t('payment.deleteConfirm'));

    if (!confirmed) {
      return;
    }

    // Set loading state
    setDeletingId(paymentId);

    try {
      const result = await deletePayment(paymentId, groupId);

      if (result.success) {
        // Refresh payment list
        onPaymentDeleted();
      } else {
        // Show error message
        alert(result.error || t('errors.deletePaymentFailed'));
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(t('errors.unexpectedError'));
    } finally {
      setDeletingId(null);
    }
  };

  // Show empty state if no payments exist
  if (payments.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500 text-lg">
          {t('payment.noPayments')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">{t('payment.history')}</h2>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            {/* Header: Payer, Amount, and Delete Button */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('payment.paidBy')}</p>
                <p className="text-lg font-bold text-gray-900">
                  {payment.payer_name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{payment.amount.toLocaleString()}
                  </p>
                </div>
                <button
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

            {/* Description */}
            {payment.description && (
              <div className="mb-3">
                <p className="text-gray-700">{payment.description}</p>
              </div>
            )}

            {/* Participants */}
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">{t('payment.participants')}</p>
              <div className="flex flex-wrap gap-2">
                {payment.participant_names.map((name, index) => (
                  <span
                    key={`${payment.id}-participant-${index}`}
                    className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Timestamp */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                {formatTimestamp(payment.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
