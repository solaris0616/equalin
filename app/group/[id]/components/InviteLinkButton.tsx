'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface InviteLinkButtonProps {
  groupId: string;
}

export function InviteLinkButton({ groupId }: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate the group URL
  const groupUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/group/${groupId}`
    : '';

  const handleCopy = async () => {
    try {
      // Use Clipboard API to copy the URL
      await navigator.clipboard.writeText(groupUrl);

      // Show success confirmation
      setCopied(true);
      setError(null);

      // Reset the success message after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      // Handle clipboard API errors gracefully
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy link. Please try again.');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Invite Link
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={groupUrl}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-muted border border-input rounded-md text-foreground"
          aria-label="Group invitation URL"
        />

        <button
          onClick={handleCopy}
          aria-label="Copy group invitation link"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {copied && !error && (
        <p className="text-sm text-green-600" role="status">
          Link copied to clipboard!
        </p>
      )}
    </div>
  );
}
