'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import type { UserRole } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Step type
// ---------------------------------------------------------------------------
type Step = 'role' | 'done';

// ---------------------------------------------------------------------------
// Role option config
// ---------------------------------------------------------------------------
interface RoleOption {
  role: UserRole;
  icon: string;
  labelKey: 'roleStep.driver' | 'roleStep.host' | 'roleStep.both';
  descKey: 'roleStep.driverDesc' | 'roleStep.hostDesc';
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'driver',
    icon: '🚗',
    labelKey: 'roleStep.driver',
    descKey: 'roleStep.driverDesc',
  },
  {
    role: 'host',
    icon: '🏠',
    labelKey: 'roleStep.host',
    descKey: 'roleStep.hostDesc',
  },
  {
    role: 'both',
    icon: '✨',
    labelKey: 'roleStep.both',
    // 'both' shares driver desc for brevity — OK since we handle the missing key gracefully
    descKey: 'roleStep.driverDesc',
  },
];

// ---------------------------------------------------------------------------
// OnboardingFlow component
// ---------------------------------------------------------------------------
export default function OnboardingFlow() {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRole, setSavedRole] = useState<UserRole | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Guard: redirect to sign-in if not authenticated
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/${locale}/auth/signin`);
    }
  }, [authLoading, user, locale, router]);

  // --------------------------------------------------------------------------
  // Role selection handler
  // --------------------------------------------------------------------------
  async function handleRoleSelect(role: UserRole) {
    if (!user) return;

    setSelectedRole(role);
    setSaveError(null);
    setSaving(true);

    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          photoURL: user.photoURL ?? undefined,
          role,
          onboardingComplete: true,
          locale,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedRole(role);
      setStep('done');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setSaveError('Something went wrong. Please try again.');
      setSelectedRole(null);
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // Loading / auth guard
  // --------------------------------------------------------------------------
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Step: Done
  // --------------------------------------------------------------------------
  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-5xl">🎉</div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {t('doneStep.heading')}
          </h1>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {/* Always show "Find Parking" */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/${locale}`)}
            >
              {t('doneStep.ctaDriver')}
            </Button>

            {/* Show "Add Listing" for host or both */}
            {(savedRole === 'host' || savedRole === 'both') && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  router.push(`/${locale}/host/listings/new`)
                }
              >
                {t('doneStep.ctaHost')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Step: Role selection
  // --------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {t('title')}
          </h1>
          <p className="mt-3 text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Step heading */}
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-700">
          {t('roleStep.heading')}
        </h2>

        {/* Role cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ROLE_OPTIONS.map(({ role, icon, labelKey, descKey }) => {
            const isSelected = selectedRole === role;
            return (
              <Card
                key={role}
                onClick={() => !saving && handleRoleSelect(role)}
                className={
                  isSelected
                    ? 'border-green-600 ring-2 ring-green-600'
                    : saving
                    ? 'cursor-not-allowed opacity-60'
                    : ''
                }
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="text-4xl">{icon}</span>
                  <span className="font-semibold text-gray-900">
                    {t(labelKey)}
                  </span>
                  {role !== 'both' && (
                    <span className="text-sm text-gray-500">{t(descKey)}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Saving indicator */}
        {saving && (
          <p className="mt-6 text-center text-sm text-gray-500">Saving…</p>
        )}

        {/* Error */}
        {saveError && (
          <p
            role="alert"
            className="mt-6 text-center text-sm font-medium text-red-600"
          >
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
