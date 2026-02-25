/**
 * Seed script — populates Firestore with sample Montreal parking listings.
 *
 * Run with:
 *   npx ts-node --project tsconfig.node.json scripts/seed.ts
 *
 * Or (if ts-node isn't installed globally):
 *   npx ts-node scripts/seed.ts
 *
 * Requires in .env.local:
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=<base64-encoded service account JSON>
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
 */

import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Load .env.local manually (ts-node doesn't auto-load Next.js env vars)
// ---------------------------------------------------------------------------
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));

// ---------------------------------------------------------------------------
// Firebase Admin initialisation
// ---------------------------------------------------------------------------
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length > 0) return getApp();

  const encoded = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    console.error(
      '\n❌  FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 is not set.\n' +
        '    Run: base64 -i service-account.json | tr -d "\\n"\n' +
        '    Then paste the result into .env.local\n'
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

initAdmin();
const db = getFirestore();

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SEED_HOST_ID = 'seed-host-001'; // placeholder; replace with a real UID

const now = Timestamp.now();
const oneYearLater = Timestamp.fromDate(
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
);

interface SeedListing {
  hostId: string;
  address: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  geo: { lat: number; lng: number };
  spotType: 'driveway' | 'surface_lot' | 'underground' | 'garage' | 'street';
  accessType: 'key' | 'code' | 'open' | 'app';
  acceptedVehicleSizes: string[];
  amenities: string[];
  description: string;
  pricingModel: 'monthly';
  monthlyRate: number;
  currency: string;
  instantBook: boolean;
  availability: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>;
  photoURLs: string[];
  status: 'active';
  totalReviews: number;
  averageRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const ALL_WEEK = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: '00:00',
  closeTime: '23:59',
}));

const seedListings: SeedListing[] = [
  // 1. Driveway — Plateau-Mont-Royal
  {
    hostId: SEED_HOST_ID,
    address: '4218 Rue Saint-Denis',
    city: 'Montreal',
    province: 'QC',
    postalCode: 'H2J 2K8',
    geo: { lat: 45.5225, lng: -73.5814 },
    spotType: 'driveway',
    accessType: 'code',
    acceptedVehicleSizes: ['compact', 'standard'],
    amenities: ['lighting'],
    description:
      'Private driveway in the heart of Plateau-Mont-Royal. ' +
      'Easy entry via keypad at the gate. Street permit not required. ' +
      'Available 24/7 — perfect for commuters working downtown.',
    pricingModel: 'monthly',
    monthlyRate: 100,
    currency: 'CAD',
    instantBook: true,
    availability: ALL_WEEK,
    photoURLs: [],
    status: 'active',
    totalReviews: 0,
    averageRating: 0,
    createdAt: now,
    updatedAt: now,
  },

  // 2. Surface lot — Mile-End
  {
    hostId: SEED_HOST_ID,
    address: '5555 Avenue du Parc',
    unit: 'Spot B-07',
    city: 'Montreal',
    province: 'QC',
    postalCode: 'H2V 4H2',
    geo: { lat: 45.5222, lng: -73.5985 },
    spotType: 'surface_lot',
    accessType: 'open',
    acceptedVehicleSizes: ['compact', 'standard', 'suv'],
    amenities: ['security_camera', 'lighting'],
    description:
      'Secured surface lot in Mile-End with 24/7 CCTV. ' +
      'No gate — just drive in and park in your designated spot (B-07). ' +
      'Walking distance to the Rosemont metro and many cafés.',
    pricingModel: 'monthly',
    monthlyRate: 130,
    currency: 'CAD',
    instantBook: true,
    availability: ALL_WEEK,
    photoURLs: [],
    status: 'active',
    totalReviews: 0,
    averageRating: 0,
    createdAt: now,
    updatedAt: now,
  },

  // 3. Underground — Downtown
  {
    hostId: SEED_HOST_ID,
    address: '1000 Rue de la Gauchetière O',
    unit: 'P2-42',
    city: 'Montreal',
    province: 'QC',
    postalCode: 'H3B 4W5',
    geo: { lat: 45.4961, lng: -73.5659 },
    spotType: 'underground',
    accessType: 'key',
    acceptedVehicleSizes: ['compact', 'standard', 'suv', 'oversized'],
    amenities: ['covered', 'ev_charging', 'security_camera', 'lighting', 'heated'],
    description:
      'Premium underground spot in the heart of downtown Montreal. ' +
      'Heated parkade — ideal for winter. EV charging included. ' +
      'Fob access. Steps from Bonaventure metro station.',
    pricingModel: 'monthly',
    monthlyRate: 175,
    currency: 'CAD',
    instantBook: false,
    availability: ALL_WEEK,
    photoURLs: [],
    status: 'active',
    totalReviews: 0,
    averageRating: 0,
    createdAt: now,
    updatedAt: now,
  },
];

// ---------------------------------------------------------------------------
// Write to Firestore
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n🌱 Seeding Firestore with sample listings…\n');

  const listingsCol = db.collection('listings');

  for (const listing of seedListings) {
    const ref = listingsCol.doc(); // auto-ID
    await ref.set(listing);
    console.log(`  ✅  ${listing.spotType.padEnd(14)} — ${listing.address} (${listing.monthlyRate} CAD/mo) → ${ref.id}`);
  }

  console.log('\n✨  Done! 3 listings seeded.\n');
  console.log(
    '💡  Tip: Replace SEED_HOST_ID ("seed-host-001") with a real user UID\n' +
    '    so the listings appear in the host dashboard.\n'
  );
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
