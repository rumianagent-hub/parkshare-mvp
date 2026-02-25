import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'fr'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

/**
 * next-intl server configuration.
 * Called on every server request that needs translations.
 */
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (
      await import(`../../messages/${locale}.json`)
    ).default,
    // Optional: set timezone for date/number formatting
    timeZone: 'America/Toronto',
    // Optional: set now for consistent relative dates in SSR
    now: new Date(),
  };
});
