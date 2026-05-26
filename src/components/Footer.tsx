"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // ランディングページ（/）ではフッターを表示しない
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black text-white py-1.5 px-4 z-50 border-t-2 border-white">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
        <p className="text-xs md:text-sm font-bold tracking-widest uppercase">
          パリカン
        </p>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white text-black px-3 py-1 text-xs md:text-sm font-bold border-2 border-black hover:bg-yellow-400 transition-colors whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新しいグループを作る</span>
        </Link>
      </div>
    </footer>
  );
}
