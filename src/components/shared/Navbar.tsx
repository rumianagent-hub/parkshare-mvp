'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
export default function Navbar() {
  const t = useTranslations('nav');
  const { user, signIn, signOut } = useAuth();
  const locale = useLocale();
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={`/${locale}`} className="text-lg font-bold text-blue-600">ParkShare</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/${locale}`}>{t('search')}</Link>
          {user ? (
            <>
              <Link href={`/${locale}/passes`}>{t('myPasses')}</Link>
              <Link href={`/${locale}/host/listings`}>{t('hostDashboard')}</Link>
              <button onClick={signOut} className="btn-secondary">{t('signOut')}</button>
            </>
          ) : (
            <button onClick={signIn} className="btn-primary">{t('signIn')}</button>
          )}
        </div>
      </nav>
    </header>
  );
}
