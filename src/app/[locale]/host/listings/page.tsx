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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page hero header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-1">
                Host Dashboard
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {t('dashboard.title')}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Manage your parking spots and track your earnings.
              </p>
            </div>
            <Link
              href={`/${params.locale}/host/listings/new`}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-800 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              <span>{t('create.title')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <HostListingsTable />
      </div>
    </div>
  );
}
