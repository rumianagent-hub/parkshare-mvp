'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function ParkShareLogo({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="flex items-center gap-2 shrink-0"
      aria-label="ParkShare home"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white font-extrabold text-sm">
        P
      </div>
      <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
        Park<span className="text-green-700">Share</span>
      </span>
    </Link>
  );
}

function UserAvatar({
  displayName,
  photoURL,
}: {
  displayName: string | null;
  photoURL: string | null;
}) {
  const initial = (displayName ?? '?').charAt(0).toUpperCase();

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={displayName ?? 'User'}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-green-500 ring-offset-1"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-xs font-bold text-white ring-2 ring-green-300 ring-offset-1">
      {initial}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-sm text-gray-600 hover:text-gray-900 transition-colors after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-green-600 after:transition-all after:duration-200 hover:after:w-full"
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const t = useTranslations('nav');
  const { user, signIn, signOut } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function switchLocale(next: string) {
    const stripped = pathname.replace(/^\/(en|fr)/, '') || '/';
    router.push(`/${next}${stripped}`);
    setMobileOpen(false);
  }

  const navLinks = [
    { href: `/${locale}`, label: t('search') },
    ...(user
      ? [
          { href: `/${locale}/passes`, label: t('myPasses') },
          { href: `/${locale}/host/listings`, label: t('hostDashboard') },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between gap-3">
          <ParkShareLogo locale={locale} />

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <UserAvatar displayName={user.displayName} photoURL={user.photoURL} />
                <button
                  onClick={signOut}
                  className="hidden md:block rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="rounded-full border border-green-700 px-2.5 py-1 text-xs md:px-4 md:py-1.5 md:text-sm font-semibold text-green-700 hover:bg-green-700 hover:text-white transition-colors"
              >
                {t('signIn')}
              </button>
            )}

            <div className="flex items-center rounded-full border border-gray-200 overflow-hidden text-xs font-semibold">
              {(['en', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLocale(lang)}
                  className={`px-2.5 py-1 transition-colors ${
                    locale === lang
                      ? 'bg-green-700 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                  aria-label={`Switch to ${lang.toUpperCase()}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <p className="px-3 text-xs text-gray-400 mb-1">
                  Signed in as {user.displayName || 'User'}
                </p>
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
