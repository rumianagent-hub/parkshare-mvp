'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VerifyResult =
  | {
      valid: true;
      driverName: string;
      listingAddress: string;
      vehiclePlate: string;
      expiresAt: string;
    }
  | {
      valid: false;
      reason: string;
    };

// ---------------------------------------------------------------------------
// Reason → human-readable message map
// ---------------------------------------------------------------------------

const REASON_MESSAGES: Record<string, string> = {
  invalid_token: 'The token is invalid or has been tampered with.',
  not_found: 'No subscription found for this token.',
  subscription_inactive:
    'This subscription is not active. It may have been cancelled or paused.',
  expired: 'This parking pass has expired. The billing period has ended.',
};

function humanReason(reason: string): string {
  return REASON_MESSAGES[reason] ?? `Verification failed (${reason}).`;
}

// ---------------------------------------------------------------------------
// Format date helper
// ---------------------------------------------------------------------------

function formatExpiry(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QRVerifier() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function handleVerify() {
    if (!input.trim()) return;

    // Extract token from URL or use raw input
    const token = input.includes('?token=')
      ? decodeURIComponent(input.split('?token=')[1])
      : input.trim();

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data: VerifyResult = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, reason: 'invalid_token' });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInput('');
    setResult(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleVerify();
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <div className="text-5xl mb-2">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Parking Pass</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the token from the driver&apos;s QR code, or scan their QR code URL
        </p>
      </div>

      {/* Input area */}
      <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
        <label
          htmlFor="token-input"
          className="block text-sm font-medium text-gray-700"
        >
          Verification URL or Token
        </label>
        <textarea
          id="token-input"
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
          placeholder={`Paste the full URL (e.g. https://…/api/verify?token=…) or just the token`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="text-xs text-gray-400">
          Tip: You can paste the entire QR code URL or just the token. Press Ctrl+Enter
          to verify.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading || !input.trim()}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying…
              </span>
            ) : (
              'Verify'
            )}
          </button>
          {(result !== null || input) && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {result !== null && (
        <div>
          {result.valid ? (
            /* ✅ Valid */
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">✅</span>
                <h2 className="text-xl font-bold text-green-800">Pass Valid</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-lg">👤</span>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Driver
                    </p>
                    <p className="font-semibold text-gray-900">{result.driverName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-lg">📍</span>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Parking Spot
                    </p>
                    <p className="font-semibold text-gray-900">{result.listingAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-lg">🚗</span>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Vehicle Plate
                    </p>
                    <p className="font-semibold text-gray-900 text-lg tracking-widest uppercase">
                      {result.vehiclePlate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-lg">📅</span>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Valid Until
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatExpiry(result.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ❌ Invalid */
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">❌</span>
                <h2 className="text-xl font-bold text-red-800">Pass Invalid</h2>
              </div>
              <p className="text-red-700 text-sm">{humanReason(result.reason)}</p>
              <p className="text-red-500 text-xs font-mono">Code: {result.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
