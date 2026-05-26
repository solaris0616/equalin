"use client";

import { useCallback, useEffect, useState } from "react";

import type { SettlementTransaction } from "@/core/domain/entities/payment";

import { calculateSettlement } from "@/app/actions/payments";

interface SettlementDisplayProps {
  groupId: string;
  refreshTrigger?: number;
  initialTransactions?: SettlementTransaction[];
}

export function SettlementDisplay({
  groupId,
  refreshTrigger,
  initialTransactions,
}: SettlementDisplayProps) {
  const [transactions, setTransactions] = useState<SettlementTransaction[]>(
    initialTransactions || []
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateSettlement = useCallback(async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const result = await calculateSettlement(groupId);
      setTransactions(result);
    } catch (err) {
      console.error("Error calculating settlement:", err);
      setError("計算に失敗しました。");
    } finally {
      setIsCalculating(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (initialTransactions) {
      setTransactions(initialTransactions);
      return;
    }
    handleCalculateSettlement();
  }, [refreshTrigger, handleCalculateSettlement, initialTransactions]);

  return (
    <div className="space-y-6">
      <div className="pixel-card bg-yellow-50 border-yellow-500 p-6">
        <h2 className="text-3xl font-bold text-black uppercase tracking-normal mb-6">
          精算結果
        </h2>

        {error && (
          <div className="p-4 bg-red-500 border-4 border-black text-white font-bold shadow-pixel mb-6">
            <p>{error}</p>
          </div>
        )}

        {isCalculating ? (
          <div className="text-center py-12">
            <p className="text-black font-bold animate-pulse">計算中...</p>
          </div>
        ) : (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-green-500 uppercase tracking-widest animate-bounce mb-4">
                  貸し借りゼロ！
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div
                    key={`${transaction.fromId}-${transaction.toId}-${transaction.amount}-${index}`}
                    className="flex items-center justify-between p-4 bg-white border-4 border-black text-lg font-bold"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-red-600 truncate">
                        {transaction.fromName}
                      </span>
                      <span className="text-black">→</span>
                      <span className="text-blue-600 truncate">
                        {transaction.toName}
                      </span>
                    </div>
                    <span className="text-xl text-black ml-4 whitespace-nowrap">
                      ¥{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
