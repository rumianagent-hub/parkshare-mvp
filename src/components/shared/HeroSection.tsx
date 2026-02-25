import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HeroSectionProps {
  headline: string;
  searchSlot: React.ReactNode;
}

// ---------------------------------------------------------------------------
// SVG dot-grid overlay
// ---------------------------------------------------------------------------
function DotGridOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="hero-dot-grid"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-dot-grid)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Parking icon watermark
// ---------------------------------------------------------------------------
function ParkingWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[-40px] top-1/2 -translate-y-1/2 select-none text-[320px] font-black text-white opacity-[0.04] leading-none"
    >
      P
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeroSection component
// ---------------------------------------------------------------------------
export default function HeroSection({ headline, searchSlot }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-600 min-h-[60vh] flex items-center">
      {/* Decorative overlays */}
      <DotGridOverlay />
      <ParkingWatermark />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(134,239,172,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        {/* Eyebrow */}
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-800/50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-green-300">
          <span>🅿️</span> Montreal&apos;s #1 Parking Marketplace
        </p>

        {/* Headline */}
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
          {headline}
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-5 max-w-xl text-lg text-green-100/80 sm:text-xl">
          Find affordable parking or earn by renting your spot — peer to peer.
        </p>

        {/* Search slot */}
        <div className="mx-auto mt-10 max-w-2xl">{searchSlot}</div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-green-200/70 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="text-base">✅</span> Verified hosts</span>
          <span className="flex items-center gap-1.5"><span className="text-base">⚡</span> Instant booking</span>
          <span className="flex items-center gap-1.5"><span className="text-base">🔒</span> Secure payments</span>
        </div>
      </div>
    </section>
  );
}
