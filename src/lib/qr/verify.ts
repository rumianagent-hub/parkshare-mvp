/**
 * QR code verification logic — server-only.
 *
 * Called by `app/api/verify/route.ts` and the host verify page server action.
 */
import 'server-only';

import { verifyAccessToken } from '@/lib/billing/mock-provider';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import type { Booking } from '@/types';

export type VerifyResult =
  | { status: 'valid'; booking: Booking }
  | { status: 'already_checked_in'; booking: Booking }
  | { status: 'invalid'; reason: string };

/**
 * Verify a QR access token and optionally mark the booking as checked-in.
 */
export async function verifyQRToken(
  token: string,
  options: { checkIn?: boolean } = {}
): Promise<VerifyResult> {
  // 1. Verify HMAC signature
  let decoded: { bookingId: string; userId: string; issuedAt: number };
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return { status: 'invalid', reason: 'signature_mismatch' };
  }

  // 2. Load booking from Firestore
  const bookingRef = adminDb
    .collection(COLLECTIONS.BOOKINGS)
    .doc(decoded.bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    return { status: 'invalid', reason: 'booking_not_found' };
  }

  const booking = { id: snap.id, ...snap.data() } as Booking;

  // 3. Status checks
  if (booking.status === 'cancelled') {
    return { status: 'invalid', reason: 'booking_cancelled' };
  }

  const now = Date.now();
  if (booking.endAt && booking.endAt.toMillis() < now) {
    return { status: 'invalid', reason: 'booking_expired' };
  }

  if (booking.checkedInAt) {
    return { status: 'already_checked_in', booking };
  }

  // 4. Optionally mark as checked in
  if (options.checkIn) {
    await bookingRef.update({
      checkedInAt: new Date(),
      status: 'active',
    });
    booking.checkedInAt = new Date() as unknown as typeof booking.checkedInAt;
    booking.status = 'active';
  }

  return { status: 'valid', booking };
}
