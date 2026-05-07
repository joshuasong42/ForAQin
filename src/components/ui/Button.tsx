'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref
) {
  let base = 'inline-flex items-center justify-center gap-2 transition rounded-xl font-medium select-none';
  switch (variant) {
    case 'primary':
      base += ' btn-primary';
      break;
    case 'ghost':
      base += ' btn-ghost';
      break;
    case 'soft':
      base += ' bg-bg-elevated text-text-primary hover:brightness-95 border border-[var(--border-soft)]';
      break;
    case 'danger':
      base += ' bg-rose/80 text-bg-base hover:bg-rose';
      break;
  }
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, SIZE[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
});

export default Button;

export function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-label="loading"
    />
  );
}
