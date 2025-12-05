'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

/**
 * RefreshButton Component
 * Floating action button for refreshing page data
 * Fixed positioning in bottom-right corner with loading state feedback
 */
export function RefreshButton({ onRefresh, className }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    // Prevent rapid repeated clicks (debounce)
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await onRefresh();
    } catch (error) {
      console.error('Error during refresh:', error);
      // Error handling is done by parent component
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        fixed bottom-4 right-4 z-40
        w-14 h-14
        bg-primary text-primary-foreground
        rounded-full shadow-lg
        flex items-center justify-center
        hover:bg-primary/90
        focus:outline-none focus:ring-4 focus:ring-primary/30
        transition-all duration-200
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className || ''}
      `}
      aria-label={isRefreshing ? 'Refreshing data...' : 'Refresh data'}
    >
      <RefreshCw
        className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}
