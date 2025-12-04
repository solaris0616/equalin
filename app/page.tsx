'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const router = useRouter();

  const handleCreateGroup = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('groups')
      .insert([{}])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating group:', error.message);
      alert('Failed to create a group. Please try again.');
      return;
    }

    router.push(`/group/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full text-center p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Equalin</h1>
        <p className="text-xl text-gray-600 mb-10">
          The simplest way to split expenses.
        </p>
        <button
          onClick={handleCreateGroup}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300 ease-in-out text-lg shadow-md"
        >
          Create a New Group
        </button>
      </div>
    </div>
  );
}
