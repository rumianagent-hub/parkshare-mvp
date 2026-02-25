import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import HostListingsTable from '@/components/host/HostListingsTable';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'host.listings' });
  return { title: t('title') };
}

export default async function HostListingsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'host' });
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'common' });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Link
          href={`/${params.locale}/host/listings/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shrink-0 transition hover:bg-green-800"
        >
          + {t('create.title')}
        </Link>
      </div>

      <HostListingsTable />
    </main>
  );
}
