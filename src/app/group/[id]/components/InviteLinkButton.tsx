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
    <div className="space-y-4 w-full md:w-auto">
      <label
        htmlFor="invite-url"
        className={cn(
          "text-xs font-bold uppercase tracking-widest",
          copied && !error ? "text-green-500" : "text-gray-500"
        )}
      >
        {copied && !error ? 'コピーしました！' : '招待リンクをシェア'}
      </label>

      <div className="flex gap-4">
        <input
          id="invite-url"
          type="text"
          value={groupUrl}
          readOnly
          className="flex-1 pixel-input text-sm"
          aria-label="Group invitation URL"
        />

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy group invitation link"
          className="pixel-button-primary flex items-center justify-center p-3"
        >
          {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-white" />}
        </button>
      </div>

      {error && (
        <p className="text-sm font-bold text-red-600 uppercase" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
