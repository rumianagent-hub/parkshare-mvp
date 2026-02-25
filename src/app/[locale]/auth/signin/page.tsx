import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import SignInForm from '@/components/auth/SignInForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signIn' });
  return { title: t('title') };
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignInForm callbackUrl={searchParams.callbackUrl} />
    </main>
  );
}
