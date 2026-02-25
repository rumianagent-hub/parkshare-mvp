'use client';

/**
 * Checkout page — /[locale]/checkout/[listingId]
 *
 * Fetches the listing from Firestore, checks auth, and renders CheckoutForm.
 * Written as a client component so we can access Firebase auth state and
 * read the listing without a server-side Firebase Admin setup in this route.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import CheckoutForm from '@/components/driver/CheckoutForm';
import type { Listing } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CheckoutListing = {
  id: string;
  address: string;
  monthlyRate?: number;
  pricingModel: string;
  hostId: string;
  currency: string;
};

function toCheckoutListing(id: string, listing: Listing): CheckoutListing {
  return {
    id,
    address: listing.address,
    monthlyRate: listing.monthlyRate,
    pricingModel: listing.pricingModel,
    hostId: listing.hostId,
    currency: listing.currency,
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const params = useParams<{ locale: string; listingId: string }>();
  const { locale, listingId } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<CheckoutListing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Fetch listing from Firestore
  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;

    async function fetchListing() {
      try {
        const snap = await getDoc(doc(db, 'listings', listingId));
        if (cancelled) return;

        if (!snap.exists()) {
          setNotFound(true);
          setListingLoading(false);
          return;
        }

        const data = snap.data() as Listing;
        if (data.status !== 'active') {
          setNotFound(true);
          setListingLoading(false);
          return;
        }

        setListing(toCheckoutListing(snap.id, data));
      } catch {
        setNotFound(true);
      } finally {
        if (!cancelled) setListingLoading(false);
      }
    }

    fetchListing();
    return () => { cancelled = true; };
  }, [listingId]);

  // Redirect to sign-in if not authenticated (after auth state is resolved)
  useEffect(() => {
    if (!authLoading && !user) {
      const callbackUrl = encodeURIComponent(`/${locale}/checkout/${listingId}`);
      router.replace(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`);
    }
  }, [authLoading, user, router, locale, listingId]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (authLoading || listingLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg
            className="h-8 w-8 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v3m0 12v3M3 12h3m12 0h3"
            />
          </svg>
          <p className="text-sm">Loading…</p>
        </div>
      </main>
    );
  }

  // Not authenticated — redirect is in progress
  if (!user) {
    return null;
  }

  if (notFound || !listing) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Listing not available</h1>
        <p className="mb-6 text-sm text-gray-500">
          This parking spot is no longer active or could not be found.
        </p>
        <Link
          href={`/${locale}/listings`}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-700 transition-colors"
        >
          ← Browse listings
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/${locale}/listings/${listingId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back to listing
        </Link>
      </div>

      <CheckoutForm listing={listing} />
    </main>
  );
}
