import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "yellow" | "green" | "destructive" | "outline" | "ghost";
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  isLoading = false,
  loadingText,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "pixel-button-primary",
    yellow: "pixel-button-yellow",
    green: "pixel-button bg-green-500 text-white hover:bg-green-600",
    destructive: "pixel-button bg-red-500 text-white hover:bg-red-600",
    outline: "pixel-button bg-white text-black hover:bg-gray-50",
    ghost: "px-4 py-2 font-bold hover:bg-gray-100 transition-colors",
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        variantClasses[variant],
        "flex items-center justify-center gap-2",
        (disabled || isLoading) &&
          "bg-gray-400 text-gray-200 cursor-not-allowed border-black pointer-events-none",

        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
