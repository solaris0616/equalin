"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface InviteLinkButtonProps {
  groupId: string;
  invitationToken: string;
  canRotate: boolean;
  onRotate: () => Promise<void>;
}

export function InviteLinkButton({
  groupId,
  invitationToken,
  canRotate,
  onRotate,
}: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const groupUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/group/${groupId}?invite=${encodeURIComponent(invitationToken)}`
      : "";

  const handleCopy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      setError(null);
      timer.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("リンクのコピーに失敗しました。もう一度お試しください。");
      timer.current = setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleRotate = async () => {
    if (
      isRotating ||
      !window.confirm(
        "招待リンクを再発行しますか？以前のリンクでは参加できなくなります。"
      )
    ) {
      return;
    }
    setIsRotating(true);
    try {
      await onRotate();
      setCopied(false);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="w-full md:w-64 space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="招待リンクをコピー"
        className={cn(
          "pixel-button w-full md:w-64 flex items-center justify-center gap-2 px-6 h-14 transition-colors",
          copied && !error
            ? "bg-green-600 hover:bg-green-700"
            : "pixel-button-primary"
        )}
      >
        {copied && !error ? (
          <>
            <Check className="w-5 h-5 text-white" />
            <span className="font-bold">コピーしました！</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 text-white" />
            <span className="font-bold whitespace-nowrap">
              招待リンクをコピー
            </span>
          </>
        )}
      </button>

      {canRotate && (
        <button
          type="button"
          onClick={handleRotate}
          disabled={isRotating}
          className="w-full text-sm font-bold underline underline-offset-4"
        >
          <RefreshCw className="mr-1 inline h-4 w-4" />
          {isRotating ? "再発行中..." : "招待リンクを再発行"}
        </button>
      )}

      {error && (
        <p
          className="mt-2 text-sm font-bold text-red-600 uppercase text-center"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
