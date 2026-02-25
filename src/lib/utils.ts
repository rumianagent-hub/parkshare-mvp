import type { ClassValue } from 'clsx';

/**
 * Lightweight className merger (no external dependency).
 * For a production app, replace with `clsx` + `tailwind-merge`.
 *
 * Install: npm install clsx tailwind-merge
 * Then replace this with:
 *   import { clsx } from 'clsx';
 *   import { twMerge } from 'tailwind-merge';
 *   export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format a price in cents to a localised currency string.
 * @param cents  Amount in cents (e.g. 1250 → "$12.50")
 * @param currency  ISO 4217 currency code (default 'CAD')
 * @param locale  BCP 47 locale string (default 'en-CA')
 */
export function formatPrice(
  cents: number,
  currency = 'CAD',
  locale = 'en-CA'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format a Firestore Timestamp or Date to a localised date string.
 */
export function formatDate(
  date: Date | { toDate(): Date } | null | undefined,
  locale = 'en-CA',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!date) return '';
  const d = 'toDate' in date ? date.toDate() : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Truncate a string to maxLen characters with an ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Generate a simple idempotency key from user + listing + timestamp (floored to minute).
 */
export function makeIdempotencyKey(userId: string, listingId: string): string {
  const minute = Math.floor(Date.now() / 60_000);
  return `${userId}-${listingId}-${minute}`;
}
