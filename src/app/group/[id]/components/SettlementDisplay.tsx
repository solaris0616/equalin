'use client';

import { useCallback, useEffect, useState } from 'react';
import { calculateSettlement } from '@/app/actions/payments';
import type { SettlementTransaction } from '@/core/domain/entities/payment';
import { cn } from '@/lib/utils';

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
      setError('計算に失敗しました。もう一度お試しください。');
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
    <div className="space-y-6">
      <div className="pixel-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-yellow-50 border-yellow-500">
        <h2 className="text-3xl font-bold text-black uppercase tracking-normal">
          精算
        </h2>
        <button
          type="button"
          onClick={handleCalculateSettlement}
          disabled={isCalculating}
          className={cn(
            'pixel-button-yellow text-xl uppercase tracking-widest',
            isCalculating && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isCalculating ? '計算中...' : '計算する'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500 border-4 border-black text-white font-bold shadow-pixel">
          <p>{error}</p>
        </div>
      )}

      {isCalculating && (
        <div className="pixel-card text-center py-12">
          <div className="inline-block animate-spin w-10 h-10 border-4 border-yellow-500 border-t-transparent" />
          <p className="mt-6 text-black font-bold animate-pulse">
            計算しています...
          </p>
        </div>
      )}

      {!isCalculating && hasCalculated && (
        <div className="pixel-card bg-white">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl font-bold text-green-500 uppercase tracking-widest animate-bounce mb-4">
                クエスト達成！
              </p>
              <p className="text-black font-bold italic">
                精算の必要はありません。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-xl font-bold text-black uppercase underline decoration-4 underline-offset-8">
                  精算の方法
                </p>
              </div>
              {transactions.map((transaction, index) => (
                <div
                  key={`${transaction.from}-${transaction.to}-${transaction.amount}-${index}`}
                  className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 border-4 border-black shadow-pixel-sm gap-4"
                >
                  <div className="flex items-center gap-4 text-lg font-bold">
                    <span className="text-red-600 bg-red-50 px-2 border-2 border-red-600 uppercase">
                      {transaction.from}
                    </span>
                    <span className="text-2xl">→</span>
                    <span className="text-blue-600 bg-blue-50 px-2 border-2 border-blue-600 uppercase">
                      {transaction.to}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-black bg-white px-4 py-2 border-4 border-black">
                    ¥{transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
