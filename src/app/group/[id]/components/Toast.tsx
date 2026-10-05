"use client";

import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number; // milliseconds, default 3000
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    []
  );

  const handleClose = useCallback(() => {
    if (exitTimer.current) return;
    setIsExiting(true);
    // Wait for exit animation to complete before calling onClose
    exitTimer.current = setTimeout(() => {
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
    type === "success" ? CheckCircle : type === "error" ? AlertCircle : Info;

  // Colors based on type
  const colorClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <div
      className={`
        fixed bottom-10 left-4 right-4 z-50
        md:left-auto md:right-8 md:max-w-md
        ${colorClasses[type]}
        pixel-card shadow-pixel
        px-6 py-4
        flex items-center gap-4
        transition-all duration-300
        ${isVisible && !isExiting ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />

      <p className="flex-1 text-base font-bold uppercase tracking-widest">
        {message}
      </p>

      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 p-1 font-bold hover:text-black transition-colors"
        aria-label="Close notification"
      >
        [X]
      </button>
    </div>
  );
}
