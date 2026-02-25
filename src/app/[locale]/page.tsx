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

// ---------------------------------------------------------------------------
// How it works section
// ---------------------------------------------------------------------------
const HOW_IT_WORKS = [
  {
    icon: '🏠',
    step: '01',
    title: 'List your spot',
    desc: 'Add your driveway, garage, or surface lot in minutes. Set your own price.',
  },
  {
    icon: '🚗',
    step: '02',
    title: 'Driver books',
    desc: 'Drivers find your spot and book instantly — no back-and-forth needed.',
  },
  {
    icon: '💰',
    step: '03',
    title: 'You earn',
    desc: 'Get paid monthly, automatically. Turn unused space into passive income.',
  },
];

function HowItWorks() {
  return (
    <section className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">
            Simple &amp; transparent
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How ParkShare works
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Whether you have a spot to rent or need a place to park — we make it effortless.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="relative flex flex-col items-center text-center px-4">
              {/* Connector line between steps */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden sm:block absolute top-10 left-[calc(50%+48px)] right-[-50%] h-px bg-gradient-to-r from-green-200 to-transparent" />
              )}

              {/* Icon circle */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-sm border border-green-100">
                <span className="text-4xl">{item.icon}</span>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-[10px] font-black text-white">
                  {item.step}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'common' });

  return (
    <main>
      <HeroSection headline={t('tagline')} searchSlot={<SearchBar />} />

      {/* Featured listings section */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-1">
              Available now
            </p>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Featured in Montréal
            </h2>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            🅿️ Live spots
          </span>
        </div>

        <FeaturedListings />
      </section>

      {/* How it works */}
      <HowItWorks />
    </main>
  );
}
