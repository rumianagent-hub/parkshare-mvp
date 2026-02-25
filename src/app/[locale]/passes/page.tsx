'use client';

import PassesList from '@/components/driver/PassesList';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PassesPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-40 rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please sign in to view your parking passes.
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Parking Passes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your monthly parking subscriptions
        </p>
      </div>
      <PassesList />
    </main>
  );
}
