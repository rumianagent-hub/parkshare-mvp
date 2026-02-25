/**
 * POST /api/verify
 *
 * Public endpoint — no auth required.
 * Used by hosts to verify a driver's QR code access token.
 *
 * Body: { token: string }
 * Returns: { valid: boolean; driverName?: string; listingAddress?: string; vehiclePlate?: string; expiresAt?: string; reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAccessToken } from '@/lib/billing/mock-provider';

export const runtime = 'nodejs'; // firebase-admin requires Node.js runtime

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    let body: { token?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 400 });
    }

    const { token } = body;
    if (!token) {
      return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 400 });
    }

    // 2. Verify the HMAC token — get subscriptionId from bookingId field
    let subscriptionId: string;
    try {
      const payload = verifyAccessToken(token);
      subscriptionId = payload.bookingId; // bookingId == subscriptionId in our schema
    } catch {
      return NextResponse.json({ valid: false, reason: 'invalid_token' });
    }

    // 3. Fetch subscription
    const subSnap = await adminDb.collection('subscriptions').doc(subscriptionId).get();
    if (!subSnap.exists) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    const subscription = subSnap.data()!;

    // 4. Check status
    if (subscription.status !== 'active') {
      return NextResponse.json({
        valid: false,
        reason: 'subscription_inactive',
        detail: subscription.status,
      });
    }

    // 5. Check period expiry
    const periodEnd: Date = subscription.currentPeriodEnd.toDate();
    if (periodEnd <= new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    // 6. Fetch driver name
    let driverName = 'Unknown Driver';
    try {
      const driverSnap = await adminDb.collection('users').doc(subscription.driverId).get();
      if (driverSnap.exists) {
        driverName = driverSnap.data()!.displayName ?? driverName;
      }
    } catch {
      // Non-fatal — proceed without driver name
    }

    // 7. Fetch listing address
    let listingAddress = 'Unknown Address';
    try {
      const listingSnap = await adminDb.collection('listings').doc(subscription.listingId).get();
      if (listingSnap.exists) {
        const listing = listingSnap.data()!;
        listingAddress = listing.city ? `${listing.address}, ${listing.city}` : listing.address;
      }
    } catch {
      // Non-fatal — proceed without listing address
    }

    // 8. Return success
    return NextResponse.json({
      valid: true,
      driverName,
      listingAddress,
      vehiclePlate: subscription.vehiclePlate,
      expiresAt: periodEnd.toISOString(),
    });
  } catch {
    return NextResponse.json({ valid: false, reason: 'invalid_token' });
  }
}
