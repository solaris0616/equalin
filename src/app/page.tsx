'use client';

import { useRouter } from 'next/navigation';
import { createGroup } from '@/app/actions/payments';

export default function Page() {
  const router = useRouter();

  const handleCreateGroup = async () => {
    const result = await createGroup();

    if (!result.success || !result.data) {
      alert('グループの作成に失敗しました。もう一度お試しください。');
      return;
    }

    router.push(`/group/${result.data.id}`);
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
          <button
            type="button"
            onClick={handleCreateGroup}
            className="w-full bg-blue-500 text-white font-bold py-5 px-8 border-4 border-black shadow-pixel hover:bg-blue-600 active:shadow-pixel-active active:translate-x-1 active:translate-y-1 transition-all text-3xl uppercase tracking-widest"
          >
            START
          </button>
        </div>
      </div>
      <p className="mt-16 text-black font-bold animate-pulse tracking-widest text-lg">
        PUSH START BUTTON
      </p>
    </div>
  );
}
