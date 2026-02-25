/**
 * POST /api/checkout/cancel
 *
 * Cancels an active subscription. Only the subscription's driver (owner)
 * can cancel their own subscription.
 *
 * Body: { subscriptionId: string }
 * Auth: Bearer token in Authorization header
 * Returns: { success: boolean } | { success: false; error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, getVerifiedTokenFromRequest } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';

export const runtime = 'nodejs'; // firebase-admin requires Node.js runtime

interface CancelBody {
  subscriptionId: string;
}

export async function POST(request: NextRequest) {
  // 1. Verify Firebase ID token
  const decodedToken = await getVerifiedTokenFromRequest(request);
  if (!decodedToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const uid = decodedToken.uid;

  // 2. Parse body
  let body: CancelBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { subscriptionId } = body;
  if (!subscriptionId) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: subscriptionId' },
      { status: 422 }
    );
  }

  // 3. Fetch subscription and verify ownership
  const subscriptionRef = adminDb.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId);
  const subscriptionSnap = await subscriptionRef.get();

  if (!subscriptionSnap.exists) {
    return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
  }

  const subscriptionData = subscriptionSnap.data() as { driverId: string; status: string };

  if (subscriptionData.driverId !== uid) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: you do not own this subscription' },
      { status: 403 }
    );
  }

  if (subscriptionData.status === 'cancelled') {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // 4. Update subscription to cancelled
  await subscriptionRef.update({
    status: 'cancelled',
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
