'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import type { UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Role option config
// ---------------------------------------------------------------------------
type Step = 'role' | 'done';

interface RoleOption {
  role: UserRole;
  icon: string;
  labelKey: 'roleStep.driver' | 'roleStep.host' | 'roleStep.both';
  descKey: 'roleStep.driverDesc' | 'roleStep.hostDesc';
  accentFrom: string;
  accentTo: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'driver',
    icon: '🚗',
    labelKey: 'roleStep.driver',
    descKey: 'roleStep.driverDesc',
    accentFrom: 'from-blue-50',
    accentTo: 'to-blue-100',
  },
  {
    role: 'host',
    icon: '🏠',
    labelKey: 'roleStep.host',
    descKey: 'roleStep.hostDesc',
    accentFrom: 'from-green-50',
    accentTo: 'to-green-100',
  },
  {
    role: 'both',
    icon: '✨',
    labelKey: 'roleStep.both',
    descKey: 'roleStep.driverDesc',
    accentFrom: 'from-purple-50',
    accentTo: 'to-purple-100',
  },
];

// ---------------------------------------------------------------------------
// Role card
// ---------------------------------------------------------------------------
function RoleCard({
  option,
  selected,
  saving,
  onSelect,
  label,
  desc,
}: {
  option: RoleOption;
  selected: boolean;
  saving: boolean;
  onSelect: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={() => !saving && onSelect()}
      disabled={saving}
      className={`relative flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition-all duration-200 w-full
        ${
          selected
            ? 'border-green-600 bg-green-50 shadow-md ring-4 ring-green-100'
            : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-sm'
        }
        ${saving && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Checkmark badge when selected */}
      {selected && (
        <div className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold shadow-sm">
          ✓
        </div>
      )}

      {/* Icon circle */}
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${option.accentFrom} ${option.accentTo} shadow-sm border border-white`}
      >
        <span className="text-5xl">{option.icon}</span>
      </div>

      {/* Label */}
      <div>
        <p className="text-lg font-bold text-gray-900">{label}</p>
        {option.role !== 'both' && (
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed max-w-[180px] mx-auto">
            {desc}
          </p>
        )}
        {option.role === 'both' && (
          <p className="mt-1.5 text-sm text-gray-400">Find spots & earn money</p>
        )}
      </div>
    </button>
  );
}

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/${locale}/auth/signin`);
    }
  }, [authLoading, user, locale, router]);

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

  // Auth loading
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
      </div>
    );
  }

  // Done step
  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-green-100 to-green-200 shadow-sm">
            <span className="text-5xl">🎉</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            {t('doneStep.heading')}
          </h1>
          <p className="text-gray-500 mb-10">You&apos;re all set! Choose where to go next.</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 transition-colors shadow-sm"
            >
              🚗 {t('doneStep.ctaDriver')}
            </button>

            {(savedRole === 'host' || savedRole === 'both') && (
              <button
                onClick={() => router.push(`/${locale}/host/listings/new`)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-green-700 px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors"
              >
                🏠 {t('doneStep.ctaHost')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Role selection step
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 text-white font-black text-3xl shadow-md">
            P
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-gray-400 max-w-sm mx-auto">{t('subtitle')}</p>
        </div>

        {/* Step heading */}
        <h2 className="mb-6 text-center text-base font-semibold text-gray-500 uppercase tracking-widest text-sm">
          {t('roleStep.heading')}
        </h2>

        {/* Role cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ROLE_OPTIONS.map((option) => (
            <RoleCard
              key={option.role}
              option={option}
              selected={selectedRole === option.role}
              saving={saving}
              onSelect={() => handleRoleSelect(option.role)}
              label={t(option.labelKey)}
              desc={option.role !== 'both' ? t(option.descKey) : ''}
            />
          ))}
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />
            <span>Saving your selection…</span>
          </div>
        )}

        {/* Error */}
        {saveError && (
          <p role="alert" className="mt-6 text-center text-sm font-medium text-red-500">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
