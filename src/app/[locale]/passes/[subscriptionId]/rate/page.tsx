'use client';

/**
 * Rate page — /[locale]/passes/[subscriptionId]/rate
 *
 * Lets a driver leave a 1-5 star review for a parking spot they subscribed to.
 * Writes to the `reviews` Firestore collection on submit.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/driver/StarRating';
import type { Subscription } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'already_rated' }
  | { status: 'unauthorized' }
  | { status: 'not_found' }
  | { status: 'ready'; subscription: Subscription; listingAddress: string }
  | { status: 'success' };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RatePage() {
  const params = useParams<{ locale: string; subscriptionId: string }>();
  const { locale, subscriptionId } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [selectedScore, setSelectedScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Redirect unauthenticated users
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      const callbackUrl = encodeURIComponent(`/${locale}/passes/${subscriptionId}/rate`);
      router.replace(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`);
    }
  }, [authLoading, user, router, locale, subscriptionId]);

  // -------------------------------------------------------------------------
  // Load subscription + check for existing review
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading || !user) return;

    const currentUser = user; // capture for async closure
    let cancelled = false;

    async function loadData() {
      try {
        // 1. Fetch subscription
        const subSnap = await getDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId));
        if (cancelled) return;

        if (!subSnap.exists()) {
          setPageState({ status: 'not_found' });
          return;
        }

        const subscription = { id: subSnap.id, ...subSnap.data() } as Subscription;

        // 2. Verify ownership
        if (subscription.driverId !== currentUser.uid) {
          setPageState({ status: 'unauthorized' });
          return;
        }

        // 3. Check for existing review
        const reviewsQuery = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('subscriptionId', '==', subscriptionId),
          limit(1)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        if (cancelled) return;

        if (!reviewsSnap.empty) {
          setPageState({ status: 'already_rated' });
          return;
        }

        // 4. Fetch listing address for display
        let listingAddress = 'Parking spot';
        try {
          const listingSnap = await getDoc(
            doc(db, COLLECTIONS.LISTINGS, subscription.listingId)
          );
          if (listingSnap.exists()) {
            const listingData = listingSnap.data() as { address?: string; city?: string };
            listingAddress = listingData.address
              ? `${listingData.address}${listingData.city ? ', ' + listingData.city : ''}`
              : listingAddress;
          }
        } catch {
          // Non-fatal — address is just for display
        }

        if (!cancelled) {
          setPageState({ status: 'ready', subscription, listingAddress });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          setPageState({ status: 'error', message });
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [authLoading, user, subscriptionId]);

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    if (pageState.status !== 'ready') return;
    if (!user) return; // shouldn't happen — guarded by redirect
    if (selectedScore === 0) {
      setSubmitError('Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        subscriptionId,
        listingId: pageState.subscription.listingId,
        hostId: pageState.subscription.hostId,
        authorId: user.uid,
        overallRating: selectedScore,
        body: comment.trim() || null,
        createdAt: serverTimestamp(),
      });

      setPageState({ status: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const backHref = `/${locale}/passes/${subscriptionId}`;

  // Loading
  if (authLoading || pageState.status === 'loading') {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  // Error states
  if (pageState.status === 'not_found') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Pass not found</h1>
        <p className="mb-6 text-sm text-gray-500">This subscription could not be found.</p>
        <Link href={`/${locale}/passes`} className="text-sm text-blue-600 hover:underline">
          ← Back to passes
        </Link>
      </main>
    );
  }

  if (pageState.status === 'unauthorized') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Not your pass</h1>
        <p className="mb-6 text-sm text-gray-500">You can only rate your own parking passes.</p>
        <Link href={`/${locale}/passes`} className="text-sm text-blue-600 hover:underline">
          ← Back to passes
        </Link>
      </main>
    );
  }

  if (pageState.status === 'error') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mb-6 text-sm text-red-600">{pageState.message}</p>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">
          ← Back to pass
        </Link>
      </main>
    );
  }

  // Already rated
  if (pageState.status === 'already_rated') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-yellow-50 p-4 text-4xl" aria-hidden>⭐</span>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          You&apos;ve already rated this listing
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Thank you for your feedback! You can only leave one review per pass.
        </p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          ← Back to pass
        </Link>
      </main>
    );
  }

  // Success
  if (pageState.status === 'success') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-green-50 p-5 text-5xl" aria-hidden>🎉</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Thank you!</h1>
        <p className="mb-6 text-sm text-gray-600">
          Your review helps the community find great parking spots.
        </p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          ← Back to pass
        </Link>
      </main>
    );
  }

  // Ready — show form
  const { listingAddress } = pageState;

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back to pass
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Rate your parking spot</h1>
          <p className="mt-1 text-sm text-gray-500">
            Share your experience to help other drivers.
          </p>
        </div>

        {/* Listing address */}
        <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Location</p>
          <p className="mt-1 font-medium text-gray-900">{listingAddress}</p>
        </div>

        {/* Star rating */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Overall rating <span className="text-red-500">*</span>
          </label>
          <StarRating
            value={selectedScore}
            onChange={setSelectedScore}
            size="lg"
          />
          {selectedScore === 0 && submitError && (
            <p className="mt-1 text-xs text-red-600">Please select a rating.</p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label
            htmlFor="comment"
            className="mb-1 block text-sm font-semibold text-gray-800"
          >
            Comments{' '}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="comment"
            rows={4}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike about this spot?"
            className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
              placeholder:text-gray-400
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {comment.length}/500
          </p>
        </div>

        {/* Submit error (non-rating) */}
        {submitError && selectedScore > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            href={backHref}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm
              hover:bg-blue-700 active:bg-blue-800 transition-colors
              disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </main>
  );
}
