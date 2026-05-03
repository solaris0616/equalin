'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createGroup } from '@/app/actions/payments';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await createGroup();

      if (!result.success || !result.data) {
        alert('グループの作成に失敗しました。もう一度お試しください。');
        setIsCreating(false);
        return;
      }

      router.push(`/group/${result.data.id}`);
      // NOTE: We don't setIsCreating(false) here because the router is navigating
    } catch (error) {
      console.error('Error creating group:', error);
      alert('エラーが発生しました。');
      setIsCreating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f0f0f0] flex flex-col justify-center items-center font-sans p-8 text-center">
      <div className="max-w-md w-full">
        <h1 className="text-8xl font-bold text-black mb-6 tracking-normal">
          Equalin
        </h1>
        <div className="h-2 bg-black w-full mb-8" />
        <p className="text-xl md:text-2xl text-black mb-16 font-bold tracking-widest leading-relaxed">
          <span className="inline-block">貸し借りゼロで、</span>
          <span className="inline-block">次の冒険へ。</span>
        </p>
        <div className="max-w-xs mx-auto">
          <Button
            onClick={handleCreateGroup}
            isLoading={isCreating}
            loadingText="STARTING..."
            className="w-full py-5 text-3xl tracking-widest"
          >
            START
          </Button>
        </div>
      </div>
      <p className="mt-16 text-black font-bold animate-pulse tracking-widest text-lg">
        PUSH START BUTTON
      </p>
    </div>
  );
}
