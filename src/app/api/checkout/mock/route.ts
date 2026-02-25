/**
 * POST /api/checkout/mock
 *
 * Mock checkout endpoint that creates a Subscription document in Firestore.
 * No real payment is processed — this simulates success or failure based on
 * the `outcome` field in the request body.
 *
 * Body: { listingId: string; outcome: 'success' | 'failure'; vehiclePlate: string; idempotencyKey?: string }
 * Returns: { success: true; subscriptionId: string } | { success: false; error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, getVerifiedTokenFromRequest } from '@/lib/firebase/admin';
import { signAccessToken } from '@/lib/billing/mock-provider';
import { COLLECTIONS } from '@/lib/firebase/firestore';

export const runtime = 'nodejs'; // firebase-admin requires Node.js runtime

interface MockCheckoutBody {
  listingId: string;
  outcome: 'success' | 'failure';
  vehiclePlate: string;
  vehicleMake?: string;
  idempotencyKey?: string;
}

export async function POST(request: NextRequest) {
  // 1. Verify Firebase ID token
  const decodedToken = await getVerifiedTokenFromRequest(request);
  if (!decodedToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const uid = decodedToken.uid;

  // 2. Parse body
  let body: MockCheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { listingId, outcome, vehiclePlate, vehicleMake } = body;

  if (!listingId || !outcome) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: listingId, outcome' },
      { status: 422 }
    );
  }

  // 3. Idempotency check: if driver already has an active subscription for this listing, return it
  const existingQuery = await adminDb
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('driverId', '==', uid)
    .where('listingId', '==', listingId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    const existingDoc = existingQuery.docs[0];
    return NextResponse.json({ success: true, subscriptionId: existingDoc.id }, { status: 200 });
  }

  // 4. Simulate failure
  if (outcome === 'failure') {
    return NextResponse.json(
      { success: false, error: 'Payment failed (simulated)' },
      { status: 402 }
    );
  }

  // 5. Process success — create subscription
  // a. Fetch listing doc
  const listingSnap = await adminDb.collection(COLLECTIONS.LISTINGS).doc(listingId).get();
  if (!listingSnap.exists) {
    return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
  }
  const listing = listingSnap.data() as {
    hostId: string;
    monthlyRate?: number;
    status?: string;
    currency?: string;
  };

  // b. Calculate price
  const monthlyRateCents = Math.round((listing.monthlyRate ?? 150) * 100);

  // c. Set dates
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  // d. Pre-allocate doc ID
  const subscriptionRef = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc();
  const subscriptionId = subscriptionRef.id;

  // e. Generate HMAC access token
  const accessToken = signAccessToken(subscriptionId, uid);

  // f. Write subscription doc
  await subscriptionRef.set({
    listingId,
    hostId: listing.hostId,
    driverId: uid,
    monthlyRateCents,
    currency: listing.currency ?? 'CAD',
    status: 'active',
    currentPeriodStart: Timestamp.fromDate(startDate),
    currentPeriodEnd: Timestamp.fromDate(endDate),
    accessToken,
    vehiclePlate: vehiclePlate || 'UNKNOWN',
    ...(vehicleMake ? { vehicleMake } : {}),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // g. Return success
  return NextResponse.json({ success: true, subscriptionId }, { status: 201 });
}
