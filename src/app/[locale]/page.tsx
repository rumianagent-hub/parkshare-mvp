import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import SearchBar from '@/components/driver/SearchBar';
import FeaturedListings from '@/components/driver/FeaturedListings';
import HeroSection from '@/components/shared/HeroSection';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'nav' });
  return { title: t('home') };
}

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <main>
      <HeroSection
        headline={t('tagline')}
        searchSlot={<SearchBar />}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FeaturedListings />
      </section>
    </main>
  );
}
