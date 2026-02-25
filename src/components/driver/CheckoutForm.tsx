'use client';

/**
 * CheckoutForm — Mock checkout UI for monthly parking passes.
 *
 * Displays an order summary and a mock payment panel.
 * Calls POST /api/checkout/mock to create a Subscription in Firestore.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutListing {
  id: string;
  address: string;
  monthlyRate?: number;
  pricingModel: string;
  hostId: string;
  currency: string;
}

interface Props {
  listing: CheckoutListing;
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

const PLATFORM_FEE_RATE = 0.12; // 12%
const HST_RATE = 0.13;          // 13% HST

function calcPrices(monthlyRate: number) {
  const spotRental = monthlyRate;
  const platformFee = parseFloat((spotRental * PLATFORM_FEE_RATE).toFixed(2));
  const hst = parseFloat(((spotRental + platformFee) * HST_RATE).toFixed(2));
  const total = parseFloat((spotRental + platformFee + hst).toFixed(2));
  return { spotRental, platformFee, hst, total };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckoutForm({ listing }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyRate = listing.monthlyRate ?? 150;
  const { spotRental, platformFee, hst, total } = calcPrices(monthlyRate);

  const today = new Date();
  const endDate = addDays(today, 30);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  async function handleSubmit(outcome: 'success' | 'failure') {
    if (!user) {
      router.push(`/${locale}/auth/signin`);
      return;
    }
    if (!vehiclePlate.trim() && outcome === 'success') {
      setError('Licence plate is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');

      const res = await fetch('/api/checkout/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          outcome,
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          vehicleMake: vehicleMake.trim() || undefined,
          idempotencyKey: `${listing.id}-${user.uid}-${todayStr}`,
        }),
      });

      const data: { success: boolean; subscriptionId?: string; error?: string } =
        await res.json();

      if (data.success && data.subscriptionId) {
        router.push(`/${locale}/passes/${data.subscriptionId}`);
      } else {
        setError(data.error ?? 'An unexpected error occurred.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Complete Your Monthly Pass
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* ── Left panel: Order summary ─────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>

          {/* Address */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Parking location</p>
            <p className="mt-1 font-medium text-gray-900">{listing.address}</p>
          </div>

          {/* Plan details */}
          <div className="mb-6 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium">Monthly Pass</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Start date</span>
              <span className="font-medium">{formatDate(today)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End date</span>
              <span className="font-medium">{formatDate(endDate)}</span>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Spot rental</span>
                <span>${formatCurrency(spotRental)}/mo</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform fee (12%)</span>
                <span>${formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>HST (13%)</span>
                <span>${formatCurrency(hst)}</span>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-3">
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>${formatCurrency(total)} CAD</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right panel: Mock payment ─────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment</h2>

          {/* Mock notice */}
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              🧪 <strong>Mock checkout</strong> — No payment is processed. For
              testing purposes only.
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Licence plate */}
            <div>
              <label
                htmlFor="vehiclePlate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Licence plate <span className="text-red-500">*</span>
              </label>
              <input
                id="vehiclePlate"
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="e.g. ABCD 123"
                maxLength={10}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest
                  placeholder:normal-case placeholder:tracking-normal
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Vehicle make / model */}
            <div>
              <label
                htmlFor="vehicleMake"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Vehicle make / model{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="vehicleMake"
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="e.g. Toyota Corolla"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            {/* Primary — Confirm */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('success')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3
                text-sm font-semibold text-white shadow-sm transition-colors
                hover:bg-green-700 active:bg-green-800
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122m8.484 8.485 2.122 2.121M5.636 18.364l2.122-2.121m8.484-8.485 2.122-2.122"
                    />
                  </svg>
                  Processing…
                </>
              ) : (
                '✅ Confirm Booking'
              )}
            </button>

            {/* Secondary — Simulate failure */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('failure')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300
                px-4 py-2 text-xs font-medium text-gray-600 transition-colors
                hover:bg-gray-50 active:bg-gray-100
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              ❌ Simulate Failure
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
