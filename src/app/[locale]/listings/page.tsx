'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Listing } from '@/types';
import Navbar from '@/components/shared/Navbar';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------
type ListingWithId = Listing & { id: string };

function displayPrice(listing: Listing): string {
  if (listing.pricingModel === 'monthly' && listing.monthlyRate)
    return `$${listing.monthlyRate}/mo`;
  if (listing.pricingModel === 'daily' && listing.dailyRate)
    return `$${listing.dailyRate}/day`;
  if (listing.pricingModel === 'hourly' && listing.hourlyRate)
    return `$${listing.hourlyRate}/hr`;
  return 'Price TBD';
}

function getEffectiveRate(listing: Listing): number {
  if (listing.pricingModel === 'monthly') return listing.monthlyRate ?? Infinity;
  if (listing.pricingModel === 'daily') return listing.dailyRate ?? Infinity;
  if (listing.pricingModel === 'hourly') return listing.hourlyRate ?? Infinity;
  return Infinity;
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  driveway: 'Driveway',
  garage: 'Garage',
  surface_lot: 'Surface Lot',
  underground: 'Underground',
  street: 'Street',
};

// ---------------------------------------------------------------------------
// Listing Card (same UI as FeaturedListings)
// ---------------------------------------------------------------------------
function ListingCard({
  listing,
  locale,
}: {
  listing: ListingWithId;
  locale: string;
}) {
  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
    >
      {/* Photo */}
      <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
        {listing.photoURLs && listing.photoURLs.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photoURLs[0]}
            alt={listing.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl select-none">🅿️</span>
        )}
        {listing.instantBook && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            ⚡ Instant Book
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate flex-1">
            {listing.address}
          </p>
          <span className="shrink-0 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {listing.city}, {listing.province}
        </p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-bold text-green-700">{displayPrice(listing)}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="text-yellow-400">★</span>
            <span>
              {listing.averageRating > 0
                ? listing.averageRating.toFixed(1)
                : 'New'}
            </span>
            {listing.totalReviews > 0 && (
              <span className="text-gray-400">({listing.totalReviews})</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Core search content (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------
function SearchContent() {
  const t = useTranslations('driver.search');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const maxPriceParam = searchParams.get('maxPrice');
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;

  const [allListings, setAllListings] = useState<ListingWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam ?? '');

  // Fetch all active listings once
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const firestoreQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(firestoreQuery);
        const data: ListingWithId[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Listing),
          id: docSnap.id,
        }));
        setAllListings(data);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchListings();
  }, []);

  // Client-side filtering
  const filtered = allListings.filter((listing) => {
    // Text filter
    if (q) {
      const matches =
        listing.address.toLowerCase().includes(q) ||
        listing.city.toLowerCase().includes(q) ||
        listing.description.toLowerCase().includes(q);
      if (!matches) return false;
    }
    // Price filter
    if (maxPrice !== null && isFinite(maxPrice)) {
      const rate = getEffectiveRate(listing);
      if (rate > maxPrice) return false;
    }
    return true;
  });

  // Apply price filter via URL
  const applyMaxPrice = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && parseFloat(value) > 0) {
        params.set('maxPrice', value);
      } else {
        params.delete('maxPrice');
      }
      router.replace(`/${locale}/listings?${params.toString()}`);
    },
    [locale, router, searchParams]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('title')}
          </h1>
          {!loading && (
            <p className="text-gray-500 mt-1 text-sm">
              {filtered.length === 1
                ? `1 spot found`
                : `${filtered.length} spots found`}
              {q ? ` for "${searchParams.get('q')}"` : ''}
            </p>
          )}
        </div>
        <Link
          href={`/${locale}`}
          className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
        >
          ← Back to home
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          Max price
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onBlur={() => applyMaxPrice(maxPriceInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyMaxPrice(maxPriceInput);
            }}
            placeholder="Any"
            className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        {(q || maxPriceParam) && (
          <Link
            href={`/${locale}/listings`}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium text-gray-700 mb-2">
            No spots found
          </p>
          <p className="text-gray-500 text-sm mb-6">{t('noResults')}</p>
          <Link
            href={`/${locale}/listings`}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            Show all listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (wraps SearchContent in Suspense for useSearchParams)
// ---------------------------------------------------------------------------
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
                  >
                    <div className="h-44 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
