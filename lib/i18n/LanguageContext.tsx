'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

// Import translation files
import enTranslations from './translations/en.json';
import jaTranslations from './translations/ja.json';
import koTranslations from './translations/ko.json';
import zhTranslations from './translations/zh.json';

// Type definitions
export type Language = 'en' | 'ja' | 'zh' | 'ko';

type TranslationValue = string | { [key: string]: TranslationValue };

type Translations = {
  [key: string]: TranslationValue;
};

export type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

// Create context
const LanguageContext = createContext<LanguageContextType | null>(null);

// Translation data
const translations: Record<Language, Translations> = {
  en: enTranslations,
  ja: jaTranslations,
  zh: zhTranslations,
  ko: koTranslations,
};

// Local storage key
const STORAGE_KEY = 'equalin_language';

/**
 * Get nested translation value from translations object using dot notation
 * @param obj - The translations object
 * @param path - The dot-separated path (e.g., "payment.title")
 * @returns The translation string or undefined if not found
 */
function getNestedTranslation(
  obj: Translations,
  path: string,
): string | undefined {
  const keys = path.split('.');
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders in translation string with provided parameters
 * @param text - The translation text with placeholders (e.g., "Hello, {name}!")
 * @param params - The parameters to replace (e.g., { name: "John" })
 * @returns The text with placeholders replaced
 */
function replacePlaceholders(
  text: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Translate a key to the current language with fallback to English
 * @param key - The translation key (e.g., "payment.title")
 * @param language - The current language
 * @param params - Optional parameters for placeholder replacement
 * @returns The translated string
 */
function translate(
  key: string,
  language: Language,
  params?: Record<string, string | number>,
): string {
  // Try to get translation in selected language
  const translation = getNestedTranslation(translations[language], key);
  if (translation) {
    return replacePlaceholders(translation, params);
  }

  // Fallback to English
  if (language !== 'en') {
    const fallback = getNestedTranslation(translations.en, key);
    if (fallback) {
      return replacePlaceholders(fallback, params);
    }
  }

  // Return key if no translation found
  return key;
}

/**
 * Language Provider Component
 * Manages language state and provides translation function to children
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;

    if (savedLanguage && ['en', 'ja', 'zh', 'ko'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }

    setIsInitialized(true);
  }, []);

  // Set language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, language, params);
  };

  // Don't render children until language is loaded from localStorage
  // This prevents flash of wrong language
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Must be used within LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
