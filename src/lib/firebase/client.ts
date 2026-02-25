import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// ---------------------------------------------------------------------------
// Firebase client-side config (all NEXT_PUBLIC_* — safe to expose in browser)
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ---------------------------------------------------------------------------
// Singleton: reuse the app if it was already initialised (important in HMR /
// dev server and Next.js Route Handlers that share the same module cache)
// ---------------------------------------------------------------------------
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

// ---------------------------------------------------------------------------
// Exported service instances
// ---------------------------------------------------------------------------
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// ---------------------------------------------------------------------------
// Emulator support — set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env.local
// to point at local Firebase emulators during development
// ---------------------------------------------------------------------------
if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
  typeof window !== 'undefined'
) {
  // Only connect once (the condition on the module level already guards this
  // for the typical HMR case, but we also check __emulatorConnected to be safe)
  const g = globalThis as typeof globalThis & { __emulatorConnected?: boolean };
  if (!g.__emulatorConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // auth emulator: connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    g.__emulatorConnected = true;
  }
}

export default app;
