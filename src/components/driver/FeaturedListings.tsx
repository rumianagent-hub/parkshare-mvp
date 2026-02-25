'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
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

const AMENITY_ICONS: Record<string, string> = {
  covered: '⛺',
  ev_charging: '⚡',
  security_camera: '📷',
  lighting: '💡',
  wheelchair: '♿',
  heated: '🔥',
};

const AMENITY_LABELS: Record<string, string> = {
  covered: 'Covered',
  ev_charging: 'EV Charging',
  security_camera: 'Security',
  lighting: 'Lighting',
  wheelchair: 'Accessible',
  heated: 'Heated',
};

// ---------------------------------------------------------------------------
// Listing card
// ---------------------------------------------------------------------------
function ListingCard({
  listing,
  locale,
}: {
  listing: ListingWithId;
  locale: string;
}) {
  const price = displayPrice(listing);
  const amenities = listing.amenities ?? [];

  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-250 hover:-translate-y-0.5 border border-gray-100"
    >
      {/* --- Image area --- */}
      <div className="relative h-48 overflow-hidden">
        {listing.photoURLs && listing.photoURLs.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photoURLs[0]}
            alt={listing.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          /* Gradient placeholder with stylized P */
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-green-600">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
                <span className="text-4xl font-black text-green-700">P</span>
              </div>
              <span className="text-xs font-medium text-green-700/60 uppercase tracking-widest">
                {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
              </span>
            </div>
          </div>
        )}

        {/* Price badge — overlaid top-right */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
          <span className="text-sm font-bold text-green-700">{price}</span>
        </div>

        {/* Instant Book badge */}
        {listing.instantBook && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-green-600 text-white rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm">
            <span>⚡</span>
            <span>Instant Book</span>
          </div>
        )}
      </div>

      {/* --- Card body --- */}
      <div className="p-4 space-y-2.5">
        {/* Address + spot type */}
        <div>
          <p className="font-semibold text-gray-900 truncate text-sm leading-snug">
            {listing.address}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {listing.city}, {listing.province}
          </p>
        </div>

        {/* Amenity icons row */}
        {amenities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                title={AMENITY_LABELS[a] ?? a}
                className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 rounded-full px-2 py-0.5"
              >
                <span>{AMENITY_ICONS[a] ?? '•'}</span>
                <span>{AMENITY_LABELS[a] ?? a}</span>
              </span>
            ))}
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-[13px] ${
                  listing.averageRating > 0 && star <= Math.round(listing.averageRating)
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
              >
                ★
              </span>
            ))}
            {listing.averageRating > 0 ? (
              <span className="text-xs text-gray-500 ml-0.5">
                {listing.averageRating.toFixed(1)}
                {listing.totalReviews > 0 && (
                  <span className="text-gray-400"> ({listing.totalReviews})</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-gray-400 ml-0.5">New</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
            {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-100 rounded flex-1" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-14" />
        </div>
        <div className="flex justify-between pt-1">
          <div className="h-4 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FeaturedListings() {
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
        <p className="text-5xl mb-4">🅿️</p>
        <p className="font-semibold text-gray-700 text-lg">No listings yet</p>
        <p className="text-sm text-gray-400 mt-1">Check back soon — spots are being added!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} locale={locale} />
      ))}
    </div>
  );
}
