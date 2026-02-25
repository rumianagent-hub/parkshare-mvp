import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default intlMiddleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
