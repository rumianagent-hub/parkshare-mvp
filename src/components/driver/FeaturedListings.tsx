'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Listing } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ListingWithId = Listing & { id: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function displayPrice(listing: Listing): string {
  if (listing.pricingModel === 'monthly' && listing.monthlyRate)
    return `$${listing.monthlyRate}/mo`;
  if (listing.pricingModel === 'daily' && listing.dailyRate)
    return `$${listing.dailyRate}/day`;
  if (listing.pricingModel === 'hourly' && listing.hourlyRate)
    return `$${listing.hourlyRate}/hr`;
  return 'Price TBD';
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  driveway: 'Driveway',
  garage: 'Garage',
  surface_lot: 'Surface Lot',
  underground: 'Underground',
  street: 'Street',
};

// ---------------------------------------------------------------------------
// Sub-components
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
// Main component
// ---------------------------------------------------------------------------
export default function FeaturedListings() {
  const t = useTranslations('driver.search');
  const locale = useLocale();
  const [listings, setListings] = useState<ListingWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const q = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          limit(8)
        );
        const snapshot = await getDocs(q);
        const data: ListingWithId[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Listing),
          id: docSnap.id,
        }));
        setListings(data);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchListings();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('title')}</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">🅿️</p>
          <p className="font-medium">No listings yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
