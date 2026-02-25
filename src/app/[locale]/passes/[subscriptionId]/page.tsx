'use client';

import PassDetail from '@/components/driver/PassDetail';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PassDetailPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const subscriptionId = params?.subscriptionId as string;

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/${locale}/passes`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Passes
        </Link>
      </div>

      <PassDetail subscriptionId={subscriptionId} />
    </main>
  );
}
