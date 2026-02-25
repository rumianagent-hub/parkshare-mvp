'use client';

/**
 * FirebaseAuthProvider
 *
 * Wraps the app with a React context that exposes the current Firebase user
 * and auth helpers. Consumed via the `useAuth` hook.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firebase auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will update `user` automatically
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will set user to null automatically
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Context accessor — exported here so FirebaseAuthProvider and useAuth
// share the same context instance even across different imports.
// ---------------------------------------------------------------------------
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuthContext must be used inside <FirebaseAuthProvider>. ' +
        'Ensure [locale]/layout.tsx wraps children with FirebaseAuthProvider.'
    );
  }
  return ctx;
}
