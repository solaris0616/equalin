"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // ランディングページ（/）ではフッターを表示しない
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black text-white p-4 z-50 border-t-4 border-white">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
        <p className="text-sm md:text-base font-bold tracking-widest uppercase">
          Powered by パリカン
        </p>
        <Link 
          href="/" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-sm md:text-base font-bold border-2 border-black hover:bg-yellow-400 transition-colors whitespace-nowrap shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>新しいグループを作る</span>
        </Link>
      </div>
    </footer>
  );
}
