'use client';

import { useEffect, useState } from 'react';
import { calculateSettlement } from '@/app/actions/payments';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { SettlementTransaction } from '@/types/payment';

interface SettlementDisplayProps {
  groupId: string;
  refreshTrigger?: number; // Optional prop to trigger recalculation
}

export function SettlementDisplay({
  groupId,
  refreshTrigger,
}: SettlementDisplayProps) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateSettlement = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const result = await calculateSettlement(groupId);
      setTransactions(result);
      setHasCalculated(true);
    } catch (err) {
      console.error('Error calculating settlement:', err);
      setError(t('errors.calculateSettlementFailed'));
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-recalculate when refreshTrigger changes (e.g., after payment deletion)
  useEffect(() => {
    if (hasCalculated && refreshTrigger !== undefined) {
      handleCalculateSettlement();
    }
  }, [refreshTrigger]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('settlement.title')}
        </h2>
        <button
          type="button"
          onClick={handleCalculateSettlement}
          disabled={isCalculating}
          className={`px-6 py-2 font-bold text-white rounded-lg transition focus:outline-none focus:ring-4 ${
            isCalculating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-300'
          }`}
        >
          {isCalculating
            ? t('settlement.calculating')
            : t('settlement.calculate')}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isCalculating && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          <p className="mt-4 text-gray-600">
            {t('settlement.calculatingMessage')}
          </p>
        </div>
      )}

      {/* Settlement Results */}
      {!isCalculating && hasCalculated && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl font-bold text-green-600 mb-2">
                {t('settlement.allSettled')}
              </p>
              <p className="text-gray-600">
                {t('settlement.noPaymentsNeeded')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                {t('settlement.transactionsNeeded', {
                  count: transactions.length,
                })}
              </p>
              {transactions.map((transaction, index) => (
                <div
                  key={`${transaction.from}-${transaction.to}-${transaction.amount}-${index}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">
                      {transaction.from}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-gray-900">
                      {transaction.to}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    ¥{transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
