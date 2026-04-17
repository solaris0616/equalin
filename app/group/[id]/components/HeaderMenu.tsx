'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Copy, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderMenuProps {
  groupId: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

/**
 * HeaderMenu Component
 * Provides invite link functionality in a dropdown menu
 */
export function HeaderMenu({
  groupId,
  onShowToast,
  className,
}: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate the group URL
  const groupUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/group/${groupId}`
      : '';

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      onShowToast('招待リンクをコピーしました', 'success');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      onShowToast('リンクのコピーに失敗しました', 'error');
    }
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors ${className || ''}`}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
          sideOffset={5}
          align="end"
        >
          {/* Invite Link Section */}
          <DropdownMenu.Item
            className="px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors"
            onSelect={handleCopyInviteLink}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              <span>招待リンクをコピー</span>
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
