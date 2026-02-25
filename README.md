# ParkShare — P2P Monthly Commuter Parking Marketplace

Montreal-focused MVP connecting drivers who need affordable monthly parking with homeowners and small lot operators who have unused spaces.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase Auth** (Google sign-in) + **Firestore** + **Firebase Storage**
- **next-intl** (EN/FR bilingual)
- **Mock billing** (Stripe-ready abstraction)

---

## Prerequisites

- Node.js 18+
- Firebase project (free Spark plan is fine for development)
- Firebase CLI: `npm install -g firebase-tools`

---

## Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **New project**
2. Enable **Authentication** → **Google provider** (set authorized domain)
3. Enable **Firestore Database** (start in test mode; deploy rules when ready)
4. *(Optional)* Enable **Storage** for listing photos

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

### Firebase Client (from Firebase Console → Project Settings → Your apps)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (from Firebase Console → Project Settings → Service Accounts)

1. Click **Generate a new private key** → download the JSON file
2. Run: `base64 -i service-account.json | tr -d '\n'`
3. Paste the output as:

```env
FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=
```

### App

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Generate with: openssl rand -hex 16
BILLING_MOCK_SECRET=your-random-32-char-string
```

---

## Running Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Deploying Firestore Rules + Indexes

```bash
firebase login
firebase init firestore   # point to your existing project
firebase deploy --only firestore
```

The `firestore.rules` and `firestore.indexes.json` files are already in the project root.

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel --prod
```

Then add all environment variables in the **Vercel Dashboard → Settings → Environment Variables**.

---

## Using Firebase Emulators (Local Dev — No Firebase Project Needed)

```bash
# Terminal 1: start emulators
npm run emulators   # starts Auth + Firestore + Storage emulators

# Terminal 2: run Next.js pointing at emulators
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev
```

The emulator UI is available at http://localhost:4000.

---

## Seeding Sample Data

```bash
# Requires FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 + NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local
npx ts-node scripts/seed.ts
```

Creates 3 sample Montreal listings (driveway, surface lot, underground) in Firestore.

---

## Project Structure

```
parking-marketplace/
├── src/
│   ├── app/
│   │   ├── [locale]/           # All locale-aware pages (EN/FR)
│   │   │   ├── page.tsx        # Homepage with listings + search
│   │   │   ├── listings/       # Listing browse + detail
│   │   │   ├── checkout/       # Mock checkout flow
│   │   │   ├── passes/         # Driver passes + QR + rating
│   │   │   ├── host/           # Host dashboard (listings, verify)
│   │   │   ├── onboarding/     # Role selection after sign-in
│   │   │   └── auth/           # Sign-in page
│   │   ├── api/
│   │   │   ├── checkout/mock/  # POST — creates subscription (mock payment)
│   │   │   └── verify/         # GET — validates QR access token
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── auth/               # FirebaseAuthProvider, SignInForm
│   │   ├── driver/             # CheckoutForm, PassDetail, StarRating, …
│   │   ├── host/               # CreateListingWizard, QRVerifier, …
│   │   ├── shared/             # Navbar, HeroSection, OnboardingFlow
│   │   └── ui/                 # Button, Card, Input primitives
│   ├── hooks/                  # useAuth, useFirestoreDoc, useFirestoreQuery
│   ├── lib/
│   │   ├── billing/            # Mock provider + Stripe-ready abstraction
│   │   ├── firebase/           # Client, Admin, typed Firestore helpers
│   │   ├── qr/                 # QR generation + HMAC verification
│   │   └── utils.ts            # cn(), formatPrice(), formatDate()
│   ├── types/                  # Shared TypeScript types (User, Listing, …)
│   └── middleware.ts           # next-intl locale routing
├── messages/
│   ├── en.json                 # English translations
│   └── fr.json                 # French translations
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Composite indexes
└── scripts/
    └── seed.ts                 # Dev/demo seed data
```

---

## User Flows

1. **Sign in** → Google OAuth → onboarding (select role: driver / host / both)
2. **Host** → Add listing → set address, spot type, pricing → listing goes live
3. **Driver** → Search by address → view listing → mock checkout → get QR pass
4. **Verification** → Host visits `/host/verify` → pastes QR URL → sees driver details (✅/❌)
5. **Rating** → Driver visits `/passes/[id]/rate` → leaves 1-5 star review

---

## Mock Billing

No real payments are processed. The checkout page presents two options:

| Button | Behaviour |
|---|---|
| ✅ Confirm Booking | Simulates success → creates active `Subscription` doc + HMAC-signed QR code |
| ❌ Simulate Failure | Returns 402, no subscription created |

**To swap in real Stripe:** see `src/lib/billing/STRIPE_MIGRATION.md` (replace `mock-provider.ts`).

---

## QR Verification

Each pass has an HMAC-signed access token. The host scans / pastes the QR URL at:

```
/host/verify?token=<accessToken>
```

The API route `GET /api/verify?token=<token>` validates the HMAC and returns driver info. Rate-limited to 60 calls/minute per token in-memory (resets on server restart).

---

## Test Checklist

- [ ] Sign in with Google
- [ ] Complete onboarding (select role: driver / host / both)
- [ ] **Host:** Create a listing (monthly rate ~$150 CAD)
- [ ] **Host:** Edit listing, toggle active/inactive
- [ ] **Driver:** See listing on homepage, search by address
- [ ] **Driver:** View listing detail
- [ ] **Driver:** Complete mock checkout (success) → redirected to pass page
- [ ] **Driver:** View pass → see QR code → download QR
- [ ] **Host:** Go to `/host/verify` → paste QR URL → see ✅ valid result
- [ ] **Driver:** Go to `passes/[id]/rate` → leave 1-5 star rating + comment
- [ ] **Driver:** Mock checkout failure → see error, no subscription created
- [ ] Switch language EN ↔ FR

---

## Known Limitations (v1)

- **No real payments** — mock only
- **No map integration** — address text only (no geocoding / map display)
- **No photo uploads** — placeholder UI
- **No push notifications**
- **QR rate limiting** uses in-memory Map (resets on server restart; use Redis in prod)
- **Hourly/daily booking** defined in types but UI only exposes the monthly pass flow

---

## Assumptions

- All prices in **CAD**
- Montreal beachhead — province defaults to **QC**
- **12% platform fee + 13% HST** (Ontario base; adjust QST to 9.975% for Quebec if needed)
- One review per subscription (enforced client-side; back it with a Firestore rule in prod)
