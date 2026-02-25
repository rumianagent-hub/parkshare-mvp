/**
 * Billing module entry point.
 *
 * Swap `MockBillingProvider` for a real provider here without
 * changing any call sites.
 */
import 'server-only';

import { MockBillingProvider } from './mock-provider';
import type { BillingProvider } from './types';

// ---------------------------------------------------------------------------
// Singleton provider instance
// ---------------------------------------------------------------------------
let _billingProvider: BillingProvider | null = null;

function getBillingProvider(): BillingProvider {
  if (!_billingProvider) {
    // TODO: swap for StripeProvider / AdyenProvider in production
    _billingProvider = new MockBillingProvider();
  }
  return _billingProvider;
}

export const billing = getBillingProvider();

// Re-export types for convenience
export type {
  BillingProvider,
  CheckoutPayload,
  CheckoutResult,
  CancelResult,
  PriceBreakdown,
  PricingModel,
} from './types';
