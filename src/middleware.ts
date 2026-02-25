import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

// Routes that require authentication (checked AFTER locale prefix is stripped)
const PROTECTED_PATTERNS = [
  /^\/host(\/.*)?$/,
  /^\/checkout(\/.*)?$/,
  /^\/passes(\/.*)?$/,
  /^\/onboarding$/,
];

// next-intl routing middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // Always show locale prefix: /en/... and /fr/...
  localePrefix: 'always',
});

/**
 * Check if the path (locale-stripped) matches a protected route.
 */
function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix: /en/host/... → /host/...
  const stripped = pathname.replace(/^\/(en|fr)/, '') || '/';
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(stripped));
}

/**
 * Read the Firebase session cookie. We don't validate the JWT here (too
 * expensive in Edge runtime) — we just check presence. The page/server
 * action does full verification.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('__session') ||
    request.cookies.has('firebase-auth-token')
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Let next-intl handle locale routing first
  const intlResponse = intlMiddleware(request);

  // 2. Auth guard — only runs on protected routes
  if (isProtectedPath(pathname)) {
    if (!hasSessionCookie(request)) {
      // Determine the locale from the incoming path (default to 'en')
      const locale = pathname.startsWith('/fr') ? 'fr' : defaultLocale;
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      // Preserve the intended destination so we can redirect after sign-in
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlResponse;
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
