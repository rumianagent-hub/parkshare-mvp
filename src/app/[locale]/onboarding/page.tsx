import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import OnboardingFlow from '@/components/shared/OnboardingFlow';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'onboarding' });
  return { title: t('title') };
}

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <OnboardingFlow />
    </main>
  );
}
