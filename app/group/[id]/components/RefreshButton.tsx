'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

/**
 * RefreshButton Component
 * Floating action button for refreshing page data
 * Positioned in bottom-right corner with loading state
 */
export function RefreshButton({ onRefresh, className }: RefreshButtonProps) {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced refresh handler to prevent rapid repeated clicks
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return; // Prevent multiple simultaneous refresh operations
    }

    setIsRefreshing(true);

    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
      // Error handling is managed by parent component
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`fixed bottom-4 right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
      aria-label={t('common.refresh') || 'Refresh'}
      title={t('common.refresh') || 'Refresh'}
    >
      <RefreshCw
        className={`w-6 h-6 mx-auto ${isRefreshing ? 'animate-spin' : ''}`}
      />
    </button>
  );
}
