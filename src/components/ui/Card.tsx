import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, onClick }, ref) => {
    const isInteractive = Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          // Base
          'rounded-xl border border-gray-200 bg-white p-6 shadow-sm',
          // Interactive extras
          isInteractive &&
            'cursor-pointer transition-all duration-150 hover:border-green-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
