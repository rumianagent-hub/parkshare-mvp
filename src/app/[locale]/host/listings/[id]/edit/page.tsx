'use client';

/**
 * Edit Listing Page
 *
 * Fetches the listing client-side by [id] from Firestore, then renders
 * <EditListingForm />. Using client-side fetch as specified (no Admin SDK needed).
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import EditListingForm from '@/components/host/EditListingForm';
import type { Listing } from '@/types';

type ListingWithId = Listing & { id: string };

function EditListingPageClient() {
  const params = useParams<{ locale: string; id: string }>();
  const id = params.id;

  const [listing, setListing] = useState<ListingWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.LISTINGS, id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setListing({ id: snap.id, ...(snap.data() as Listing) });
        }
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton */}
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-800 mb-2">Listing not found</p>
        <p className="text-sm text-gray-500">
          This listing may have been deleted or you don&apos;t have access to it.
        </p>
      </div>
    );
  }

  return <EditListingForm listing={listing} />;
}

export default function EditListingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <EditListingPageClient />
    </main>
  );
}
