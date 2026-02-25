/**
 * Firebase Admin SDK — server-only.
 * Used in Route Handlers and Server Actions.
 *
 * IMPORTANT: Never import this file in client components.
 * The firebase-admin package will throw if bundled client-side.
 */
import 'server-only';

import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Decode the base64-encoded service account JSON stored in the env var.
// This avoids multi-line JSON headaches in .env files and CI secrets.
// ---------------------------------------------------------------------------
function getServiceAccount(): object {
  const encoded = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    throw new Error(
      'FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 environment variable is not set. ' +
        'Run `base64 -i service-account.json` and store the result in your env.'
    );
  }
  const json = Buffer.from(encoded, 'base64').toString('utf-8');
  return JSON.parse(json);
}

// ---------------------------------------------------------------------------
// Singleton — Next.js serverless functions can share the module cache within
// the same worker process, so we reuse an existing app when possible.
// ---------------------------------------------------------------------------
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert(getServiceAccount() as Parameters<typeof cert>[0]),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// ---------------------------------------------------------------------------
// Lazy singleton instances — initialised on first use (not at module import)
// so that Next.js build-time static analysis doesn't fail when env vars are
// absent.  The credentials are only truly needed at request time.
// ---------------------------------------------------------------------------
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function getAdminAuthInstance(): Auth {
  if (!_adminAuth) {
    const app = getAdminApp();
    _adminAuth = getAuth(app);
  }
  return _adminAuth;
}

function getAdminDbInstance(): Firestore {
  if (!_adminDb) {
    const app = getAdminApp();
    _adminDb = getFirestore(app);
  }
  return _adminDb;
}

/** Firebase Admin Auth — verify ID tokens, manage users */
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getAdminAuthInstance();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(instance) : value;
  },
});

/** Firebase Admin Firestore — full read/write with no security rules */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getAdminDbInstance();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(instance) : value;
  },
});

// ---------------------------------------------------------------------------
// Helper: verify a Firebase ID token from a request cookie/header
// ---------------------------------------------------------------------------
export async function verifyIdToken(idToken: string) {
  return adminAuth.verifyIdToken(idToken, /* checkRevoked */ true);
}

/**
 * Extract and verify the Firebase ID token from an incoming Request.
 * Looks for `Authorization: Bearer <token>` header first, then
 * falls back to the `__session` cookie (set by the client after login).
 */
export async function getVerifiedTokenFromRequest(request: Request) {
  // 1. Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyIdToken(token);
  }

  // 2. Cookie fallback (for server-rendered pages / middleware)
  const cookie = request.headers.get('cookie') ?? '';
  const sessionMatch = cookie.match(/(?:^|;\s*)__session=([^;]+)/);
  if (sessionMatch) {
    return verifyIdToken(sessionMatch[1]);
  }

  return null;
}
