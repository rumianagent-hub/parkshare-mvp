'use client';

/**
 * useAuth
 *
 * Convenience hook that re-exports the Firebase auth context.
 * Components import from here instead of reaching into the context directly.
 *
 * Usage:
 *   const { user, loading, signIn, signOut } = useAuth();
 */

import { useAuthContext } from '@/components/auth/FirebaseAuthProvider';
import type { AuthContextValue } from '@/components/auth/FirebaseAuthProvider';

export type { AuthContextValue };

export function useAuth(): AuthContextValue {
  return useAuthContext();
}
