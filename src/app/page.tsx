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
    <div className="relative min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full text-center p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Equalin</h1>
        <p className="text-xl text-gray-600 mb-10">
          最もシンプルな割り勘アプリ
        </p>
        <button
          type="button"
          onClick={handleCreateGroup}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300 ease-in-out text-lg shadow-md"
        >
          新しいグループを作成
        </button>
      </div>
    </div>
  );
}
