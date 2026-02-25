import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HeroSectionProps {
  headline: string;
  searchSlot: React.ReactNode;
}

// ---------------------------------------------------------------------------
// SVG dot-grid overlay — embedded as a React element to avoid unsafe CSS data URIs.
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
// HeroSection component
// ---------------------------------------------------------------------------
export default function HeroSection({ headline, searchSlot }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-800 to-green-600">
      {/* Subtle dot-grid pattern overlay */}
      <DotGridOverlay />

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {headline}
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-4 max-w-xl text-lg text-green-100 sm:text-xl">
          Montreal&apos;s parking marketplace
        </p>

        {/* Search slot */}
        <div className="mx-auto mt-10 max-w-2xl">{searchSlot}</div>
      </div>
    </section>
  );
}
