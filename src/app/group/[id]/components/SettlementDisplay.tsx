"use client";
import type { SettlementTransaction } from "@/core/domain/entities/payment";
interface SettlementDisplayProps {
  transactions: SettlementTransaction[];
  isRoughMode?: boolean;
}
export function SettlementDisplay({
  transactions,
  isRoughMode,
}: SettlementDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="pixel-card bg-yellow-50 border-yellow-500 p-6">
        <h2 className="text-2xl font-bold text-black uppercase tracking-normal mb-6 flex justify-between items-center gap-2">
          <span>精算結果</span>
          {isRoughMode && (
            <span className="text-sm normal-case bg-yellow-300 border-2 border-black px-2 py-0.5 font-bold">
              どんぶり勘定中
            </span>
          )}
        </h2>
        {isRoughMode && (
          <p className="mb-4 text-sm">
            送金ごとに千円単位で四捨五入する概算です。実際の残高とは差額が生じます。
          </p>
        )}

        <div>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl font-bold text-green-500 uppercase tracking-widest animate-bounce mb-4">
                {isRoughMode ? "送金対象なし（端数省略）" : "貸し借りゼロ！"}
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
                  <span className="text-lg text-black ml-4 whitespace-nowrap">
                    ¥{transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
