"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface InviteLinkButtonProps {
  groupId: string;
}

export function InviteLinkButton({ groupId }: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/group/${groupId}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      setError(null);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("リンクのコピーに失敗しました。もう一度お試しください。");
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  return (
    <div className="w-full md:w-64">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy group invitation link"
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
