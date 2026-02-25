'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Listing, Amenity, SpotType, AccessType, VehicleSize } from '@/types';

// ---------------------------------------------------------------------------
// Serializable listing type (timestamps are plain objects for server → client)
// ---------------------------------------------------------------------------
type PlainTimestamp = { seconds: number; nanoseconds: number };
export type DisplayListing = Omit<Listing, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: PlainTimestamp | unknown;
  updatedAt?: PlainTimestamp | unknown;
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

function bookingLabel(listing: DisplayListing): string {
  return listing.pricingModel === 'monthly' ? 'Get Monthly Pass' : 'Book Now';
}

const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  driveway: 'Driveway',
  garage: 'Garage',
  surface_lot: 'Surface Lot',
  underground: 'Underground',
  street: 'Street',
};

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  key: 'Key',
  code: 'Gate Code',
  open: 'Open Access',
  app: 'App-Controlled',
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

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-10">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT / MAIN COLUMN                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-2 space-y-8">
        {/* Photo */}
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-green-50 flex items-center justify-center">
          {listing.photoURLs && listing.photoURLs.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photoURLs[0]}
              alt={listing.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-green-700">
              <span className="text-8xl">🅿️</span>
              <p className="text-sm font-medium text-green-600">No photos yet</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.address}</h1>
          {listing.unit && (
            <p className="text-gray-500 mt-1">Unit {listing.unit}</p>
          )}
          <p className="text-gray-500 mt-1">
            {listing.city}, {listing.province} {listing.postalCode}
          </p>
          <p className="italic text-gray-400 text-sm mt-2">
            {t('locationNote')}
          </p>
        </div>

        {/* Host info */}
        <div className="flex items-center gap-3 py-4 border-t border-gray-100">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm shrink-0">
            {hostName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('hostedBy')}</p>
            <p className="font-semibold text-gray-900">{hostName}</p>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t('description')}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </section>
        )}

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('amenities')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm flex items-center gap-1.5"
                >
                  <span>{AMENITY_ICONS[amenity] ?? '•'}</span>
                  <span>{AMENITY_LABELS[amenity] ?? amenity}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Spot details */}
        <section className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('spotDetails')}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Spot Type
              </dt>
              <dd className="font-semibold text-gray-900">
                {SPOT_TYPE_LABELS[listing.spotType] ?? listing.spotType}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Access
              </dt>
              <dd className="font-semibold text-gray-900">
                {ACCESS_TYPE_LABELS[listing.accessType] ?? listing.accessType}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:col-span-2">
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Accepted Vehicle Sizes
              </dt>
              <dd className="flex flex-wrap gap-2">
                {listing.acceptedVehicleSizes && listing.acceptedVehicleSizes.length > 0 ? (
                  listing.acceptedVehicleSizes.map((size) => (
                    <span
                      key={size}
                      className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-0.5 text-sm"
                    >
                      {VEHICLE_SIZE_LABELS[size] ?? size}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Not specified</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Reviews placeholder */}
        <section className="border-t border-gray-100 pt-6 pb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('reviews')}
          </h2>
          {listing.totalReviews === 0 ? (
            <p className="text-gray-400 italic">{t('noReviews')}</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {listing.averageRating.toFixed(1)}
              </span>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= Math.round(listing.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {listing.totalReviews}{' '}
                  {listing.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT SIDEBAR                                                        */}
      {/* ------------------------------------------------------------------ */}
      <aside className="mt-8 lg:mt-0">
        <div className="sticky top-6 bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5">
          {/* Price */}
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-green-700">
                {displayPrice(listing)}
              </span>
              <span className="text-gray-500 mb-1 text-sm">{pricingLabel(listing)}</span>
            </div>
            {listing.currency && (
              <p className="text-xs text-gray-400 mt-0.5">{listing.currency}</p>
            )}
          </div>

          {/* Instant Book badge */}
          {listing.instantBook && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2 text-sm font-medium">
              <span>⚡</span>
              <span>Instant Book available</span>
            </div>
          )}

          {/* Rating */}
          {listing.totalReviews > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="text-yellow-400 text-base">★</span>
              <span className="font-semibold">{listing.averageRating.toFixed(1)}</span>
              <span className="text-gray-400">
                ({listing.totalReviews}{' '}
                {listing.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Book button */}
          <Link
            href={`/${locale}/checkout/${listing.id}`}
            className="block w-full text-center bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 text-lg font-semibold transition-colors"
          >
            {bookingLabel(listing)}
          </Link>

          {/* Mock note */}
          <p className="text-xs text-gray-400 text-center">
            No payment required today — mock checkout
          </p>
        </div>
      </aside>
    </div>
  );
}
