'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // milliseconds, default 3000
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  }, [onClose]);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Set up auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [duration, handleClose]);

  // Icon based on type
  const Icon =
    type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  // Colors based on type
  const colorClasses = {
    success: 'bg-green-600 text-white',
    error: 'bg-destructive text-destructive-foreground',
    info: 'bg-primary text-primary-foreground',
  };

  return (
    <div
      className={`
        fixed bottom-20 left-4 right-4 z-50
        md:left-auto md:right-4 md:max-w-md
        ${colorClasses[type]}
        rounded-lg shadow-lg
        px-4 py-3
        flex items-center gap-3
        transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />

      <p className="flex-1 text-sm font-medium">{message}</p>

      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
