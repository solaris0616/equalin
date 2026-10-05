"use client";

import { Button } from "@/components/ui/Button";

export default function GroupError({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-md mx-auto my-20 pixel-card space-y-4" role="alert">
      <h1 className="text-xl font-bold">データを読み込めませんでした</h1>
      <p>通信状況を確認して、もう一度お試しください。</p>
      <Button onClick={reset}>再試行</Button>
    </main>
  );
}
