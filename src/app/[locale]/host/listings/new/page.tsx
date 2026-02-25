import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import CreateListingWizard from '@/components/host/CreateListingWizard';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'host.create' });
  return { title: t('title') };
}

export default function NewListingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <CreateListingWizard />
    </main>
  );
}
