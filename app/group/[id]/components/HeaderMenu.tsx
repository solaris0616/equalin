'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Menu, Copy, Check, Globe } from 'lucide-react';
import { type Language, useLanguage } from '@/lib/i18n/LanguageContext';

interface HeaderMenuProps {
  groupId: string;
  className?: string;
}

/**
 * HeaderMenu Component
 * Combines language selection and invite link functionality in a dropdown menu
 */
export function HeaderMenu({ groupId, className }: HeaderMenuProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate the group URL
  const groupUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/group/${groupId}`
    : '';

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      setError(null);

      // Reset success message after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError(t('errors.copyLinkFailed'));

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={`p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors ${className || ''}`}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
          sideOffset={5}
          align="end"
        >
          {/* Language Selection Section */}
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('common.language') || 'Language'}
            </div>
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          {languages.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              className={`px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${
                language === lang.code
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
              }`}
              onSelect={() => handleLanguageChange(lang.code)}
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          {/* Invite Link Section */}
          <DropdownMenu.Item
            className="px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors"
            onSelect={handleCopyInviteLink}
          >
            <div className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">{t('common.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('group.inviteLink')}</span>
                </>
              )}
            </div>
          </DropdownMenu.Item>

          {error && (
            <div className="px-3 py-2 text-xs text-destructive" role="alert">
              {error}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
