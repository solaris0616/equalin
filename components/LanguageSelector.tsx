'use client';

import { type Language, useLanguage } from '@/lib/i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language Selector Component
 * Displays a dropdown to switch between supported languages
 */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className={className}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
