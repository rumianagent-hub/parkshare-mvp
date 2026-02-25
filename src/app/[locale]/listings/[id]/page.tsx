import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import ListingDetailView, {
  type DisplayListing,
} from '@/components/driver/ListingDetailView';
import { adminDb } from '@/lib/firebase/admin';
import type { Listing } from '@/types';
import Navbar from '@/components/shared/Navbar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert any Firestore Timestamp-like object to a plain object */
function serializeTimestamp(
  ts: unknown
): { seconds: number; nanoseconds: number } | undefined {
  if (!ts) return undefined;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'seconds' in ts &&
    'nanoseconds' in ts
  ) {
    return {
      seconds: (ts as { seconds: number }).seconds,
      nanoseconds: (ts as { nanoseconds: number }).nanoseconds,
    };
  }
  return undefined;
}

/** Fetch a single listing from Firestore (admin SDK, server-only) */
async function fetchListing(id: string): Promise<DisplayListing | null> {
  try {
    const docRef = adminDb.collection('listings').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    const data = docSnap.data() as Listing;
    if (!data) return null;

    // Serialize: convert Timestamp instances to plain objects so they can
    // cross the server → client component boundary safely.
    const listing: DisplayListing = {
      ...(data as Omit<Listing, 'createdAt' | 'updatedAt'>),
      id: docSnap.id,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    };
    return listing;
  } catch (err) {
    console.error('fetchListing error:', err);
    return null;
  }
}

/** Fetch the host's display name from the users collection */
async function fetchHostName(hostId: string): Promise<string> {
  try {
    const userSnap = await adminDb.collection('users').doc(hostId).get();
    if (!userSnap.exists) return 'Host';
    const data = userSnap.data();
    return (data?.displayName as string) ?? 'Host';
  } catch {
    return 'Host';
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const listing = await fetchListing(params.id);
  if (!listing) return { title: 'Listing Not Found' };
  return {
    title: listing.address,
    description: listing.description
      ? listing.description.slice(0, 160)
      : `Parking spot in ${listing.city}, ${listing.province}`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function ListingDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const listing = await fetchListing(params.id);

  // Not found or not active
  if (!listing || listing.status !== 'active') {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <p className="text-6xl mb-6">🅿️</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Listing not found
          </h1>
          <p className="text-gray-500 mb-8">
            This spot may no longer be available or the link may be incorrect.
          </p>
          <Link
            href={`/${params.locale}`}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const hostName = await fetchHostName(listing.hostId);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href={`/${params.locale}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to home
          </Link>
        </nav>

        <ListingDetailView listing={listing} hostName={hostName} />
      </div>
    </main>
  );
}
