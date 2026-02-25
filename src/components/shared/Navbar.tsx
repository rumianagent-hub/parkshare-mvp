'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Language switcher: swaps the locale prefix in the current URL
// ---------------------------------------------------------------------------
function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // e.g. "/en/host/listings"

  function switchLocale(next: string) {
    // Replace the leading locale segment with the new one
    const stripped = pathname.replace(/^\/(en|fr)/, '') || '/';
    router.push(`/${next}${stripped}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 text-xs font-medium">
      {(['en', 'fr'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLocale(lang)}
          className={`rounded-md px-2 py-1 transition-colors ${
            locale === lang
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-800'
          }`}
          aria-label={`Switch to ${lang.toUpperCase()}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User avatar: shows photo or initials
// ---------------------------------------------------------------------------
function UserAvatar({ displayName, photoURL }: { displayName: string | null; photoURL: string | null }) {
  const initial = (displayName ?? '?').charAt(0).toUpperCase();

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={displayName ?? 'User'}
        className="h-8 w-8 rounded-full object-cover border border-gray-200"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
      {initial}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
export default function Navbar() {
  const t = useTranslations('nav');
  const { user, signIn, signOut } = useAuth();
  const locale = useLocale();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="text-lg font-bold text-green-700 hover:text-green-800 transition-colors"
        >
          🅿️ ParkShare
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/${locale}`}
            className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('search')}
          </Link>

          {user ? (
            <>
              <Link
                href={`/${locale}/passes`}
                className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('myPasses')}
              </Link>
              <Link
                href={`/${locale}/host/listings`}
                className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('hostDashboard')}
              </Link>

              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  displayName={user.displayName}
                  photoURL={user.photoURL}
                />
                {user.displayName && (
                  <span className="hidden md:block text-sm text-gray-700 font-medium max-w-[120px] truncate">
                    {user.displayName.split(' ')[0]}
                  </span>
                )}
              </div>

              <button
                onClick={signOut}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <button onClick={signIn} className="btn-primary text-xs px-3 py-1.5">
              {t('signIn')}
            </button>
          )}

          {/* Language switcher */}
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
