"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

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
    <div className="space-y-2 w-full md:w-auto">
      {copied && !error ? (
        <label
          htmlFor="invite-url"
          className="text-sm font-medium text-green-600"
        >
          コピーしました！
        </label>
      ) : (
        <label
          htmlFor="invite-url"
          className="text-sm font-medium text-gray-700"
        >
          招待リンク
        </label>
      )}

      <div className="flex gap-2">
        <input
          id="invite-url"
          type="text"
          value={groupUrl}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-900"
          aria-label="Group invitation URL"
        />

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy group invitation link"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
