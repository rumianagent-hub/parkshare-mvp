'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { generateQRDataURL, buildVerifyUrl } from '@/lib/qr/generate';
import type { Subscription, Listing, UserProfile } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PassData {
  subscription: Subscription & { id: string };
  listing: Listing | null;
  host: UserProfile | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  subscriptionId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: { toDate(): Date }): string {
  return ts.toDate().toLocaleDateString('en-CA', {
    month: 'long',
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// QR Section
// ---------------------------------------------------------------------------

function QRSection({ accessToken }: { accessToken: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);

    generateQRDataURL(buildVerifyUrl(accessToken), { width: 280 })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="max-w-xs mx-auto rounded-xl border-2 border-green-400 bg-white p-6 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Entry QR Code</h3>
      <p className="text-sm text-gray-500 mb-4">
        Show this QR code at the parking spot
      </p>

      {generating ? (
        <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-lg bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="QR Code"
          className="mx-auto"
          width={280}
          height={280}
        />
      ) : (
        <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-lg bg-gray-100 text-gray-400 text-sm">
          Failed to generate QR code
        </div>
      )}

      {qrDataUrl && (
        <a
          href={qrDataUrl}
          download="parking-pass.png"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ⬇️ Download QR Code
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PassDetail({ subscriptionId }: Props) {
  const [data, setData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subSnap = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subSnap.exists()) {
        setError('Pass not found.');
        return;
      }

      const subscription = {
        ...(subSnap.data() as Subscription),
        id: subSnap.id,
      };

      let listing: Listing | null = null;
      try {
        const listingSnap = await getDoc(doc(db, 'listings', subscription.listingId));
        if (listingSnap.exists()) {
          listing = { ...(listingSnap.data() as Listing), id: listingSnap.id };
        }
      } catch {
        // non-fatal
      }

      let host: UserProfile | null = null;
      try {
        const hostSnap = await getDoc(doc(db, 'users', subscription.hostId));
        if (hostSnap.exists()) {
          host = hostSnap.data() as UserProfile;
        }
      } catch {
        // non-fatal
      }

      setData({ subscription, listing, host });
    } catch (err) {
      console.error('Failed to fetch pass:', err);
      setError('Failed to load pass. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCancel() {
    if (!data) return;
    const confirmed = window.confirm(
      'Are you sure you want to cancel this monthly pass? This cannot be undone.'
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ subscriptionId: data.subscription.id }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? 'Failed to cancel pass. Please try again.');
      }
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Failed to cancel pass. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">{error ?? 'Pass not found.'}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm text-red-600 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { subscription, listing, host } = data;
  const monthlyRate = `$${(subscription.monthlyRateCents / 100).toFixed(2)}/mo`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Your Parking Pass</h1>
        <StatusBadge status={subscription.status} />
      </div>

      {/* Listing info */}
      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="text-2xl">🅿️</span>
          <span>{listing?.address ?? 'Unknown Address'}</span>
        </div>
        {listing?.city && (
          <p className="text-sm text-gray-500 pl-9">{listing.city}</p>
        )}
        <div className="pl-9 space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Rate:</span> {monthlyRate}
          </p>
          <p>
            <span className="font-medium">Period:</span>{' '}
            {formatDate(subscription.currentPeriodStart)} →{' '}
            {formatDate(subscription.currentPeriodEnd)}
          </p>
        </div>
      </div>

      {/* Host info */}
      {host && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Hosted by{' '}
            <span className="font-medium text-gray-900">{host.displayName}</span>
          </p>
        </div>
      )}

      {/* Vehicle info */}
      <div className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Vehicle
        </h2>
        <p className="text-gray-900">
          <span className="font-medium">Plate:</span> {subscription.vehiclePlate}
        </p>
        {subscription.vehicleMake && (
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Make:</span> {subscription.vehicleMake}
          </p>
        )}
      </div>

      {/* QR code — active only */}
      {subscription.status === 'active' && (
        <QRSection accessToken={subscription.accessToken} />
      )}

      {/* Cancel button — active only */}
      {subscription.status === 'active' && (
        <div className="pt-2">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full rounded-xl border-2 border-red-200 bg-white py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Pass'}
          </button>
        </div>
      )}
    </div>
  );
}
