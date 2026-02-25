'use client';

/**
 * useFirestoreDoc — real-time document subscription hook.
 *
 * Usage:
 *   const { data, loading, error } = useFirestoreDoc<Listing>(
 *     listingDoc(db, listingId)
 *   );
 */
import { useEffect, useState } from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type FirestoreError,
} from 'firebase/firestore';

interface UseFirestoreDocResult<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useFirestoreDoc<T>(
  ref: DocumentReference<T> | null | undefined
): UseFirestoreDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? snap.data() : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ref?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
