/**
 * Mock billing provider — simulates a payment processor.
 * Replace with a real provider (Stripe, Adyen, etc.) for production.
 *
 * Server-only: signs tokens with HMAC-SHA256.
 */
import 'server-only';

import crypto from 'crypto';
import type {
  BillingProvider,
  CancelResult,
  CheckoutPayload,
  CheckoutResult,
  PriceBreakdown,
  PricingModel,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SERVICE_FEE_RATE = 0.12; // 12 % platform fee
const TAX_RATE = 0.13;         // 13 % HST (Ontario)

// ---------------------------------------------------------------------------
// HMAC token helpers
// ---------------------------------------------------------------------------
function getSecret(): string {
  const secret = process.env.BILLING_MOCK_SECRET;
  if (!secret) throw new Error('BILLING_MOCK_SECRET env var is not set');
  return secret;
}

/**
 * Sign a payload and return a compact `<payload>.<signature>` token.
 * Safe to embed in QR codes.
 */
export function signAccessToken(bookingId: string, userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ bookingId, userId, issuedAt: Date.now() })
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

/**
 * Verify an access token. Returns the decoded payload or throws.
 */
export function verifyAccessToken(
  token: string
): { bookingId: string; userId: string; issuedAt: number } {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) throw new Error('Malformed token');

  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    throw new Error('Invalid token signature');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
}

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------
function calcSubtotalCents(
  ratePerHour: number,
  pricingModel: PricingModel,
  startAt: Date,
  endAt: Date
): number {
  const hours = (endAt.getTime() - startAt.getTime()) / 3_600_000;

  switch (pricingModel) {
    case 'hourly':
      return Math.round(ratePerHour * hours * 100);
    case 'daily':
      return Math.round(ratePerHour * 24 * Math.ceil(hours / 24) * 100);
    case 'monthly':
      // Flat monthly rate stored as ratePerHour field (reused as monthly rate $)
      return Math.round(ratePerHour * 100);
  }
}

// ---------------------------------------------------------------------------
// Mock provider implementation
// ---------------------------------------------------------------------------
export class MockBillingProvider implements BillingProvider {
  // Fake listing rate lookup (replace with Firestore read in production)
  private readonly mockRatePerUnit: Record<PricingModel, number> = {
    hourly: 3.5,
    daily: 20,
    monthly: 120,
  };

  async calculatePrice(
    _listingId: string,
    pricingModel: PricingModel,
    startAt: Date,
    endAt: Date
  ): Promise<PriceBreakdown> {
    const rate = this.mockRatePerUnit[pricingModel];
    const subtotal = calcSubtotalCents(rate, pricingModel, startAt, endAt);
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
    const taxes = Math.round((subtotal + serviceFee) * TAX_RATE);
    return {
      subtotal,
      serviceFee,
      taxes,
      total: subtotal + serviceFee + taxes,
      currency: 'CAD',
    };
  }

  async checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 400));

    // Simulate occasional failure for testing (10 % chance)
    if (Math.random() < 0.1) {
      return {
        success: false,
        bookingId: '',
        accessToken: '',
        priceBreakdown: {
          subtotal: 0,
          serviceFee: 0,
          taxes: 0,
          total: 0,
          currency: 'CAD',
        },
        error: 'mock_payment_declined',
      };
    }

    const bookingId = `bk_${crypto.randomBytes(8).toString('hex')}`;
    const accessToken = signAccessToken(bookingId, payload.userId);
    const priceBreakdown = await this.calculatePrice(
      payload.listingId,
      payload.pricingModel,
      payload.startAt,
      payload.endAt
    );

    return {
      success: true,
      bookingId,
      accessToken,
      priceBreakdown,
    };
  }

  async cancel(bookingId: string, _userId: string): Promise<CancelResult> {
    await new Promise((r) => setTimeout(r, 200));
    // Mock: always succeed, refund 80 % of total
    return {
      success: true,
      refundAmount: 0, // would come from Firestore booking doc in production
    };
  }
}
