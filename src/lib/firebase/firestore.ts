/**
 * Typed Firestore collection references + converter helpers.
 * Import `db` from ./client (client components) or `adminDb` from ./admin (server).
 */
import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  Listing,
  Booking,
  UserProfile,
  Review,
  Subscription,
} from '@/types';

// ---------------------------------------------------------------------------
// Generic converter: strips undefined values on write, adds `id` on read
// ---------------------------------------------------------------------------
function makeConverter<T extends { id?: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = data;
      // Remove undefined fields to keep Firestore documents clean
      return Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined)
      );
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
  };
}

// ---------------------------------------------------------------------------
// Collection paths (single source of truth)
// ---------------------------------------------------------------------------
export const COLLECTIONS = {
  USERS: 'users',
  LISTINGS: 'listings',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

// ---------------------------------------------------------------------------
// Typed collection references (client-side Firestore instance)
// ---------------------------------------------------------------------------

export function usersCol(db: Firestore): CollectionReference<UserProfile> {
  return collection(db, COLLECTIONS.USERS).withConverter(
    makeConverter<UserProfile>()
  );
}

export function listingsCol(db: Firestore): CollectionReference<Listing> {
  return collection(db, COLLECTIONS.LISTINGS).withConverter(
    makeConverter<Listing>()
  );
}

export function bookingsCol(db: Firestore): CollectionReference<Booking> {
  return collection(db, COLLECTIONS.BOOKINGS).withConverter(
    makeConverter<Booking>()
  );
}

export function reviewsCol(db: Firestore): CollectionReference<Review> {
  return collection(db, COLLECTIONS.REVIEWS).withConverter(
    makeConverter<Review>()
  );
}

export function subscriptionsCol(
  db: Firestore
): CollectionReference<Subscription> {
  return collection(db, COLLECTIONS.SUBSCRIPTIONS).withConverter(
    makeConverter<Subscription>()
  );
}

// ---------------------------------------------------------------------------
// Typed document reference helpers
// ---------------------------------------------------------------------------

export function listingDoc(db: Firestore, id: string): DocumentReference<Listing> {
  return doc(db, COLLECTIONS.LISTINGS, id).withConverter(
    makeConverter<Listing>()
  );
}

export function bookingDoc(db: Firestore, id: string): DocumentReference<Booking> {
  return doc(db, COLLECTIONS.BOOKINGS, id).withConverter(
    makeConverter<Booking>()
  );
}

export function userDoc(db: Firestore, uid: string): DocumentReference<UserProfile> {
  return doc(db, COLLECTIONS.USERS, uid).withConverter(
    makeConverter<UserProfile>()
  );
}
