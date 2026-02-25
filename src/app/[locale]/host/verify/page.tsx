'use client';

import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import QRVerifier from '@/components/host/QRVerifier';

export default function VerifyPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'en';

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/auth/signin`);
    }
  }, [user, loading, locale, router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-40 mx-auto rounded bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (!user) {
    // Redirect is in progress
    return null;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Verify Pass</h1>
      </div>
      <QRVerifier />
    </main>
  );
}
