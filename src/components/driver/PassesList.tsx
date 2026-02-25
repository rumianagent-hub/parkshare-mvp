'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Subscription, Listing } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PassWithListing {
  subscription: Subscription & { id: string };
  listing: Listing | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: { toDate(): Date }): string {
  return ts.toDate().toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Subscription['status'] }) {
  const styles: Record<Subscription['status'], string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PassCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-3 w-28 rounded bg-gray-100" />
            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pass card
// ---------------------------------------------------------------------------

function PassCard({ pass, locale }: { pass: PassWithListing; locale: string }) {
  const { subscription, listing } = pass;
  const address = listing ? `${listing.address}` : 'Unknown Address';
  const city = listing?.city ?? '';
  const rate = `$${(subscription.monthlyRateCents / 100).toFixed(2)}/mo`;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl">
          🅿️
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{address}</span>
            {city && <span className="text-gray-500 text-sm">{city}</span>}
            <StatusBadge status={subscription.status} />
          </div>
          <p className="text-sm text-gray-500">
            Valid:{' '}
            <span className="text-gray-700">
              {formatDate(subscription.currentPeriodStart)} –{' '}
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </p>
          <p className="text-sm font-medium text-gray-700">{rate}</p>
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/${locale}/passes/${subscription.id}`}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        View Pass
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PassesList() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const [passes, setPasses] = useState<PassWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchPasses() {
      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('driverId', '==', user!.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);

        const results: PassWithListing[] = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const subscription = {
              ...(docSnap.data() as Subscription),
              id: docSnap.id,
            };

            let listing: Listing | null = null;
            try {
              const listingSnap = await getDoc(
                doc(db, 'listings', subscription.listingId)
              );
              if (listingSnap.exists()) {
                listing = { ...(listingSnap.data() as Listing), id: listingSnap.id };
              }
            } catch {
              // listing fetch failed — show pass without address
            }

            return { subscription, listing };
          })
        );

        setPasses(results);
      } catch (err) {
        console.error('Failed to fetch passes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPasses();
  }, [user, authLoading]);

  // Split into tabs
  const activePasses = passes.filter((p) => p.subscription.status === 'active');
  const pastPasses = passes.filter((p) =>
    ['cancelled', 'expired', 'paused'].includes(p.subscription.status)
  );

  const displayed = activeTab === 'active' ? activePasses : pastPasses;

  if (authLoading || loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <PassCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(['active', 'past'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'active' ? 'Active' : 'Past'}
            {tab === 'active' && activePasses.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                {activePasses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pass cards */}
      {displayed.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <div className="text-4xl mb-3">🅿️</div>
          <p className="text-gray-500 text-sm">
            {activeTab === 'active'
              ? 'No active passes. Browse listings to get started.'
              : 'No past passes.'}
          </p>
          {activeTab === 'active' && (
            <Link
              href={`/${locale}/listings`}
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse listings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((pass) => (
            <PassCard key={pass.subscription.id} pass={pass} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
