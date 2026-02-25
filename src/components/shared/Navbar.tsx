'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// ParkShare logo with green circle "P" icon
// ---------------------------------------------------------------------------
function ParkShareLogo({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="flex items-center gap-2.5 group"
      aria-label="ParkShare home"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white font-extrabold text-sm shadow-sm group-hover:bg-green-800 transition-colors">
        P
      </div>
      <span className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-green-700 transition-colors">
        Park<span className="text-green-700">Share</span>
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Language switcher: pill style
// ---------------------------------------------------------------------------
function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    const stripped = pathname.replace(/^\/(en|fr)/, '') || '/';
    router.push(`/${next}${stripped}`);
  }

  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
      {(['en', 'fr'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLocale(lang)}
          className={`rounded-full px-3 py-1 transition-all duration-150 ${
            locale === lang
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-700'
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
// User avatar: circular with green ring, initials or photo
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Nav link with hover underline effect
// ---------------------------------------------------------------------------
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative text-sm text-gray-600 hover:text-gray-900 transition-colors after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-green-600 after:transition-all after:duration-200 hover:after:w-full"
    >
      {children}
    </Link>
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
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <ParkShareLogo locale={locale} />

        {/* Right side */}
        <div className="flex items-center gap-4 text-sm">
          {/* Navigation links */}
          <NavLink href={`/${locale}`}>{t('search')}</NavLink>

          {user ? (
            <>
              <NavLink href={`/${locale}/passes`} >{t('myPasses')}</NavLink>
              <NavLink href={`/${locale}/host/listings`}>{t('hostDashboard')}</NavLink>

              {/* User avatar + first name */}
              <div className="flex items-center gap-2 pl-1">
                <UserAvatar
                  displayName={user.displayName}
                  photoURL={user.photoURL}
                />
                {user.displayName && (
                  <span className="hidden md:block text-sm text-gray-700 font-medium max-w-[100px] truncate">
                    {user.displayName.split(' ')[0]}
                  </span>
                )}
              </div>

              <button
                onClick={signOut}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="rounded-full border-2 border-green-700 px-5 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-700 hover:text-white transition-all duration-150"
            >
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
