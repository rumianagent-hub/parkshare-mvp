/**
 * Locale layout — sets <html lang>, provides next-intl + Firebase auth contexts.
 *
 * All pages inside [locale]/ are wrapped here.
 */

// Force dynamic rendering for all pages in this layout.
// These pages are auth-gated and use Firebase (requires headers/cookies at
// request time), so they must never be statically prerendered.
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Inter } from 'next/font/google';

import { FirebaseAuthProvider } from '@/components/auth/FirebaseAuthProvider';
import Navbar from '@/components/shared/Navbar';
import { locales, type Locale } from '@/lib/i18n';
import '../globals.css';

// ---------------------------------------------------------------------------
// Font
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// ---------------------------------------------------------------------------
// Dynamic metadata per locale
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'common',
  });

  return {
    title: {
      default: `${t('appName')} — ${t('tagline')}`,
      template: `%s | ${t('appName')}`,
    },
    description: t('tagline'),
  };
}

// ---------------------------------------------------------------------------
// Layout component
// ---------------------------------------------------------------------------
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load all messages for this locale (passed to client via NextIntlClientProvider)
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseAuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </FirebaseAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
