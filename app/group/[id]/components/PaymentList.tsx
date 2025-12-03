'use client';

import type { PaymentWithDetails } from '@/app/actions/payments';
import { integerToAmount } from '@/lib/utils/currency';

interface PaymentListProps {
  payments: PaymentWithDetails[];
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

export function PaymentList({ payments }: PaymentListProps) {
  // Show empty state if no payments exist
  if (payments.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500 text-lg">
          No payments yet. Add your first payment to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            {/* Header: Payer and Amount */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Paid by</p>
                <p className="text-lg font-bold text-gray-900">
                  {payment.payer_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  ${integerToAmount(payment.amount)}
                </p>
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
              <p className="text-sm text-gray-500 mb-1">Participants</p>
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
