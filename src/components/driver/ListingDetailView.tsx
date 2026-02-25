'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import type { Listing, Amenity, SpotType, AccessType, VehicleSize } from '@/types';
import { db } from '@/lib/firebase/client';

// ---------------------------------------------------------------------------
// Serializable listing type
// ---------------------------------------------------------------------------
type PlainTimestamp = { seconds: number; nanoseconds: number };
export type DisplayListing = Omit<Listing, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: PlainTimestamp | unknown;
  updatedAt?: PlainTimestamp | unknown;
};

type ReviewItem = {
  id: string;
  listingId: string;
  authorName?: string;
  authorPhotoURL?: string;
  overallRating: number;
  body?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function displayPrice(listing: DisplayListing): string {
  if (listing.pricingModel === 'monthly' && listing.monthlyRate)
    return `$${listing.monthlyRate}`;
  if (listing.pricingModel === 'daily' && listing.dailyRate)
    return `$${listing.dailyRate}`;
  if (listing.pricingModel === 'hourly' && listing.hourlyRate)
    return `$${listing.hourlyRate}`;
  return '—';
}

function pricingLabel(listing: DisplayListing): string {
  if (listing.pricingModel === 'monthly') return '/ month';
  if (listing.pricingModel === 'daily') return '/ day';
  if (listing.pricingModel === 'hourly') return '/ hr';
  return '';
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function timeAgo(ts?: { seconds: number } | null): string {
  if (!ts) return '';
  const diff = Math.floor((Date.now() / 1000 - ts.seconds) / 86400);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 30) return `${diff} days ago`;
  if (diff < 60) return '1 month ago';
  return `${Math.floor(diff / 30)} months ago`;
}

const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  driveway: 'Driveway',
  garage: 'Garage',
  surface_lot: 'Surface Lot',
  underground: 'Underground',
  street: 'Street',
};

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  key: '🔑 Key',
  code: '🔢 Gate Code',
  open: '🚪 Open Access',
  app: '📱 App-Controlled',
};

const VEHICLE_SIZE_LABELS: Record<VehicleSize, string> = {
  compact: 'Compact',
  standard: 'Standard',
  suv: 'SUV / Truck',
  oversized: 'Oversized',
};

const AMENITY_ICONS: Record<Amenity, string> = {
  covered: '⛺',
  ev_charging: '⚡',
  security_camera: '📷',
  lighting: '💡',
  wheelchair: '♿',
  heated: '🔥',
};

const AMENITY_LABELS: Record<Amenity, string> = {
  covered: 'Covered',
  ev_charging: 'EV Charging',
  security_camera: 'Security Camera',
  lighting: 'Lighting',
  wheelchair: 'Wheelchair Accessible',
  heated: 'Heated',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Divider() {
  return <hr className="border-gray-100" />;
}

function HostAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-700 text-white font-bold text-lg shrink-0 shadow-sm">
      {initial}
    </div>
  );
}

function ReviewAvatar({ name, photoURL }: { name: string; photoURL?: string }) {
  if (photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoURL} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold text-sm">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  listing: DisplayListing;
  hostName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ListingDetailView({ listing, hostName }: Props) {
  const t = useTranslations('driver.listingDetail');
  const locale = useLocale();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('listingId', '==', listing.id),
          limit(10)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ReviewItem, 'id'>) }))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds ?? 0;
            const bTime = b.createdAt?.seconds ?? 0;
            return bTime - aTime;
          });
        setReviews(items);
      } catch (err) {
        console.error('Reviews fetch error:', err);
      }
    }

    if (listing.id) void fetchReviews();
  }, [listing.id]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return listing.averageRating ?? 0;
    const total = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
    return total / reviews.length;
  }, [reviews, listing.averageRating]);

  const reviewCount = reviews.length || listing.totalReviews || 0;

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* HERO IMAGE — full-width, h-80                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden mb-8">
        {listing.photoURLs && listing.photoURLs.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photoURLs[0]}
            alt={listing.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-800 to-green-500 flex flex-col items-center justify-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
              <span className="text-6xl">🅿️</span>
            </div>
            <p className="text-green-200/70 text-sm font-medium uppercase tracking-widest">
              {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TWO-COLUMN GRID                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT / MAIN COLUMN                                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-7">
          {/* Title & location */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {listing.address}
              {listing.unit && (
                <span className="text-xl font-normal text-gray-400 ml-2">
                  Unit {listing.unit}
                </span>
              )}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-gray-500 text-sm">
              <span>📍</span>
              <span>
                {listing.city}, {listing.province} {listing.postalCode}
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-400 italic">{t('locationNote')}</p>
          </div>

          <Divider />

          {/* Host section */}
          <div className="flex items-center gap-4">
            <HostAvatar name={hostName} />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                {t('hostedBy')}
              </p>
              <p className="font-semibold text-gray-900 text-lg">{hostName}</p>
              <p className="text-sm text-gray-400">ParkShare member</p>
            </div>
          </div>

          <Divider />

          {/* Description */}
          {listing.description && (
            <>
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('description')}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </section>
              <Divider />
            </>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('amenities')}
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                      <span>{AMENITY_ICONS[amenity] ?? '•'}</span>
                      <span>{AMENITY_LABELS[amenity] ?? amenity}</span>
                    </span>
                  ))}
                </div>
              </section>
              <Divider />
            </>
          )}

          {/* Spot details */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('spotDetails')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                  Spot Type
                </p>
                <p className="font-semibold text-gray-900">
                  {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                  Access Method
                </p>
                <p className="font-semibold text-gray-900">
                  {ACCESS_TYPE_LABELS[listing.accessType] ?? listing.accessType}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                  Accepted Vehicle Sizes
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.acceptedVehicleSizes && listing.acceptedVehicleSizes.length > 0 ? (
                    listing.acceptedVehicleSizes.map((size) => (
                      <span
                        key={size}
                        className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-medium"
                      >
                        {VEHICLE_SIZE_LABELS[size] ?? size}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <Divider />

          {/* Reviews */}
          <section className="pb-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ⭐ Reviews
              {reviewCount > 0 && (
                <span className="ml-2 text-base font-normal text-gray-500">({reviewCount})</span>
              )}
            </h2>

            {reviewCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews yet — be the first!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const authorName = review.authorName || 'Anonymous';
                  return (
                    <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <ReviewAvatar name={authorName} photoURL={review.authorPhotoURL} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900 truncate">{authorName}</p>
                            <p className="text-xs text-gray-400 whitespace-nowrap">
                              {timeAgo(review.createdAt)}
                            </p>
                          </div>
                          <div className="mt-1 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= Math.round(review.overallRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.body && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.body}</p>}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT SIDEBAR — sticky booking card                              */}
        {/* ---------------------------------------------------------------- */}
        <aside className="mt-8 lg:mt-0">
          <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
            {/* Price */}
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-green-700 leading-none">
                  {displayPrice(listing)}
                </span>
                <span className="text-gray-400 text-sm mb-1">{pricingLabel(listing)}</span>
              </div>
              {listing.currency && (
                <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                  {listing.currency}
                </span>
              )}
            </div>

            {/* Instant Book badge */}
            {listing.instantBook && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-100 rounded-xl px-3 py-2 text-sm font-semibold">
                <span>⚡</span>
                <span>Instant Book available</span>
              </div>
            )}

            {/* Rating in sidebar */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="text-yellow-400 text-base">★</span>
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-gray-400">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Booking details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Starting</span>
                <span className="font-medium text-gray-800">{todayFormatted()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Duration</span>
                <span className="font-medium text-gray-800">Monthly pass (30 days)</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* CTA button */}
            <Link
              href={`/${locale}/checkout/${listing.id}`}
              className="flex w-full items-center justify-center rounded-xl bg-green-700 py-4 text-lg font-semibold text-white shadow-sm hover:bg-green-800 transition-colors duration-150"
            >
              Get Monthly Pass
            </Link>

            {/* Footnotes */}
            <p className="text-xs text-gray-400 text-center italic">No payment required today</p>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-[10px] font-medium text-gray-400">
                🧪 Mock checkout
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
