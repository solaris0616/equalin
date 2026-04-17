'use client';

import { useCallback, useEffect, useState } from 'react';
import { calculateSettlement } from '@/app/actions/payments';
import type { SettlementTransaction } from '@/domain/entities/payment';

interface SettlementDisplayProps {
  groupId: string;
  refreshTrigger?: number;
}

export function SettlementDisplay({
  groupId,
  refreshTrigger,
}: SettlementDisplayProps) {
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateSettlement = useCallback(async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const result = await calculateSettlement(groupId);
      setTransactions(result);
      setHasCalculated(true);
    } catch (err) {
      console.error('Error calculating settlement:', err);
      setError('精算の計算に失敗しました。もう一度お試しください。');
    } finally {
      setIsCalculating(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (hasCalculated && refreshTrigger !== undefined) {
      handleCalculateSettlement();
    }
  }, [hasCalculated, refreshTrigger, handleCalculateSettlement]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">精算</h2>
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
          {isCalculating ? '計算中...' : '精算を計算'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isCalculating && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          <p className="mt-4 text-gray-600">精算を計算中...</p>
        </div>
      )}

      {!isCalculating && hasCalculated && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl font-bold text-green-600 mb-2">
                精算完了！
              </p>
              <p className="text-gray-600">支払いは必要ありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                すべての債務を精算するには{transactions.length}
                件の取引が必要です:
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
