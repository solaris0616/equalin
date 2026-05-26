"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { deletePayment } from "@/app/actions/payments";
import { Button } from "@/components/ui/Button";
import type { PaymentWithDetails } from "@/core/domain/entities/payment";

interface PaymentListProps {
  payments: PaymentWithDetails[];
  groupId: string;
  isOwner: boolean;
  onPaymentDeleted: () => void;
  onEdit: (payment: PaymentWithDetails) => void;
}

export function PaymentList({
  payments,
  groupId,
  isOwner,
  onPaymentDeleted,
  onEdit,
}: PaymentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (paymentId: string) => {
    const confirmed = window.confirm("この支払いを削除してもよろしいですか？");

    if (!confirmed) {
      return;
    }

    setDeletingId(paymentId);

    try {
      const result = await deletePayment(groupId, paymentId);

      if (result.success) {
        onPaymentDeleted();
      } else {
        alert(result.error || "支払いの削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("予期しないエラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="pixel-card text-center py-12">
        <p className="text-gray-500 text-xl font-bold italic uppercase">ログがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div key={payment.id} className="pixel-card border-l-[12px] border-l-blue-500 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <p className="text-xl font-bold text-black uppercase">{payment.payerName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600 tracking-tighter">
                  ¥{payment.amount.toLocaleString()}
                </p>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => onEdit(payment)}
                    disabled={deletingId !== null}
                    aria-label="Edit payment"
                    className="p-2"
                    title="Edit payment"
                  >
                    <Pencil className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(payment.id)}
                    isLoading={deletingId === payment.id}
                    disabled={deletingId !== null && deletingId !== payment.id}
                    aria-label="Delete payment"
                    className="p-2"
                    title="Delete payment"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {payment.description && (
            <div className="mb-4 p-2 bg-gray-50 border-2 border-dashed border-black">
              <p className="text-black font-bold">{payment.description}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase">割り勘メンバー</p>
            <div className="flex flex-wrap gap-2">
              {payment.participantNames.map((name, index) => (
                <span
                  key={`${payment.id}-participant-${index}`}
                  className="inline-block px-2 py-0.5 text-sm font-bold bg-gray-200 border-2 border-black"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
