import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Input component
// ---------------------------------------------------------------------------
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon, className, id, ...props }, ref) => {
    // Generate a stable id for label association if none provided
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-gray-400">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : hint
                ? `${inputId}-hint`
                : undefined
            }
            className={cn(
              // Base styles
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
              'placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              // Leading icon padding
              Boolean(leadingIcon) && 'pl-10',
              // Normal state
              !hasError &&
                'border-gray-300 focus:border-green-600 focus:ring-green-600',
              // Error state
              hasError &&
                'border-red-500 focus:border-red-500 focus:ring-red-500',
              // Disabled state
              props.disabled && 'cursor-not-allowed bg-gray-50 opacity-60',
              className
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {hasError && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Hint text — only shown when no error */}
        {!hasError && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
