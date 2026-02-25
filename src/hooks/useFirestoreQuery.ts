'use client';

/**
 * useFirestoreQuery — real-time collection query subscription hook.
 *
 * Usage:
 *   const q = query(listingsCol(db), where('status', '==', 'active'), limit(20));
 *   const { data, loading, error } = useFirestoreQuery<Listing>(q);
 */
import { useEffect, useState } from 'react';
import {
  onSnapshot,
  type Query,
  type FirestoreError,
} from 'firebase/firestore';

interface UseFirestoreQueryResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useFirestoreQuery<T>(
  query: Query<T> | null | undefined
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snap) => {
        setData(snap.docs.map((d) => d.data()));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
