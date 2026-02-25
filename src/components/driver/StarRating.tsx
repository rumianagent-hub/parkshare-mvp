'use client';

/**
 * StarRating — Reusable interactive (or readonly) star rating widget.
 *
 * Usage:
 *   <StarRating value={0} onChange={setScore} />                // interactive
 *   <StarRating value={4} onChange={() => {}} readonly size="sm" />  // display-only
 */

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StarRatingProps {
  /** Currently selected value. 0 = nothing selected. */
  value: number;
  /** Called when the user clicks a star. */
  onChange: (v: number) => void;
  /** If true, stars are not interactive. */
  readonly?: boolean;
  /** Visual size. Default: 'md'. */
  size?: 'sm' | 'md' | 'lg';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STAR_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const SIZE_CLASSES = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const;

// ---------------------------------------------------------------------------
// StarIcon — inline SVG so we can fill/stroke precisely
// ---------------------------------------------------------------------------

function StarIcon({
  filled,
  hovered,
  className,
}: {
  filled: boolean;
  hovered: boolean;
  className: string;
}) {
  const filled_ = filled || hovered;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={{
        fill: filled_ ? '#FBBF24' : 'none',
        stroke: filled_ ? '#FBBF24' : '#D1D5DB',
        strokeWidth: 1.5,
        transition: 'fill 120ms ease, stroke 120ms ease',
      }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0
           .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0
           -.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0
           0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0
           0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0
           0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverIndex, setHoverIndex] = useState(0); // 1-based, 0 = no hover

  const starClass = SIZE_CLASSES[size];

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1"
        role={readonly ? undefined : 'radiogroup'}
        aria-label="Star rating"
        onMouseLeave={() => !readonly && setHoverIndex(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;
          const isHovered = !readonly && star <= hoverIndex;

          return (
            <button
              key={star}
              type="button"
              role={readonly ? undefined : 'radio'}
              aria-checked={star === value}
              aria-label={`${star} star${star !== 1 ? 's' : ''} — ${STAR_LABELS[star]}`}
              disabled={readonly}
              onClick={() => !readonly && onChange(star)}
              onMouseEnter={() => !readonly && setHoverIndex(star)}
              className={[
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 rounded',
                readonly ? 'cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <StarIcon
                filled={isFilled}
                hovered={isHovered}
                className={starClass}
              />
            </button>
          );
        })}
      </div>

      {/* Label for the currently hovered/selected star */}
      {!readonly && (
        <p
          className="h-5 text-sm font-medium text-yellow-600 transition-opacity"
          aria-live="polite"
        >
          {hoverIndex > 0
            ? STAR_LABELS[hoverIndex]
            : value > 0
              ? STAR_LABELS[value]
              : ''}
        </p>
      )}
    </div>
  );
}
