// ---------------------------------------------------------------------------
// Billing abstraction types
// Keeps the real payment logic swappable behind a single interface.
// ---------------------------------------------------------------------------

export type PricingModel = 'hourly' | 'daily' | 'monthly';

export interface PriceBreakdown {
  subtotal: number;   // in cents
  serviceFee: number; // in cents
  taxes: number;      // in cents
  total: number;      // in cents
  currency: string;   // e.g. 'CAD'
}

export interface CheckoutPayload {
  listingId: string;
  userId: string;
  pricingModel: PricingModel;
  startAt: Date;
  endAt: Date;
  vehiclePlate: string;
  vehicleMake?: string;
  /** Idempotency key — reuse to prevent double-charges */
  idempotencyKey: string;
}

export interface CheckoutResult {
  success: boolean;
  bookingId: string;
  /** Signed JWT/HMAC token encoding bookingId — used for QR code */
  accessToken: string;
  priceBreakdown: PriceBreakdown;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  refundAmount: number; // in cents
  error?: string;
}

/** Pluggable billing provider interface */
export interface BillingProvider {
  checkout(payload: CheckoutPayload): Promise<CheckoutResult>;
  cancel(bookingId: string, userId: string): Promise<CancelResult>;
  calculatePrice(
    listingId: string,
    pricingModel: PricingModel,
    startAt: Date,
    endAt: Date
  ): Promise<PriceBreakdown>;
}
