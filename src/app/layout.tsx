/**
 * Root layout — intentionally minimal.
 *
 * The <html> and <body> tags are rendered in src/app/[locale]/layout.tsx so
 * that the `lang` attribute can be set per-locale. This is the recommended
 * next-intl App Router pattern (see next-intl docs / examples).
 *
 * Next.js merges layout trees, so the locale layout's <html> wins.
 */
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'ParkShare — Find & Share Parking',
    template: '%s | ParkShare',
  },
  description:
    'ParkShare is a peer-to-peer parking marketplace. Find affordable parking spots or earn money by renting yours.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    siteName: 'ParkShare',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intentionally no <html>/<body> — provided by [locale]/layout.tsx
  return <>{children}</>;
}
