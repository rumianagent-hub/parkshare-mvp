'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState } from 'react';

export default function SearchBar() {
  const t = useTranslations('driver.search');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const [query, setQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/${locale}/listings?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full max-w-xl mx-auto overflow-hidden rounded-xl bg-white shadow-lg"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('placeholder')}
        className="flex-1 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm"
        aria-label={t('placeholder')}
      />
      <button
        type="submit"
        className="bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        {tCommon('search')}
      </button>
    </form>
  );
}
