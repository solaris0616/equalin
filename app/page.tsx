'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function Page() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleCreateGroup = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('groups')
      .insert([{}])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating group:', error.message);
      alert(t('errors.createGroupFailed'));
      return;
    }

    router.push(`/group/${data.id}`);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20">
        <LanguageSelector className="px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm hover:shadow-md" />
      </div>
      <div className="max-w-md w-full text-center p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          {t('home.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-10">{t('home.subtitle')}</p>
        <button
          onClick={handleCreateGroup}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300 ease-in-out text-lg shadow-md"
        >
          {t('home.createGroup')}
        </button>
      </div>
    </div>
  );
}
