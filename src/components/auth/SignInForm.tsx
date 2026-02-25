'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';

// ---------------------------------------------------------------------------
// Google SVG icon
// ---------------------------------------------------------------------------
function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SignInFormProps {
  callbackUrl?: string;
}

// ---------------------------------------------------------------------------
// SignInForm component
// ---------------------------------------------------------------------------
export default function SignInForm({ callbackUrl }: SignInFormProps) {
  const t = useTranslations('auth.signIn');
  const locale = useLocale();
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = loading || authLoading;

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn();

      const { auth } = await import('@/lib/firebase/client');
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data()?.onboardingComplete) {
          router.push(`/${locale}/onboarding`);
          return;
        }
      }

      const destination = callbackUrl ?? `/${locale}`;
      router.push(destination);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in (err as { code?: string }) &&
        (err as { code?: string }).code === 'auth/popup-closed-by-user'
      ) {
        setError(t('error.popupClosed'));
      } else {
        setError(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 font-black text-2xl text-white shadow-md">
            P
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Park<span className="text-green-700">Share</span>
          </h1>
        </div>

        {/* Title & subtitle */}
        <div className="mb-7 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
          <p className="mt-1.5 text-sm text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {/* Google sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          ) : (
            <GoogleIcon />
          )}
          {t('continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">secure sign-in</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          By signing in, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-gray-600">Terms</span>
          {' '}and{' '}
          <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
