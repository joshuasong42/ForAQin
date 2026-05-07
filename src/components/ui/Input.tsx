'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, ...rest },
  ref
) {
  return (
    <label className="block">
      {label && <span className="block mb-1 text-sm text-text-muted">{label}</span>}
      <input ref={ref} className={cn('input', className)} {...rest} />
    </label>
  );
});

type TAProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TAProps>(function Textarea(
  { className, label, ...rest },
  ref
) {
  return (
    <label className="block">
      {label && <span className="block mb-1 text-sm text-text-muted">{label}</span>}
      <textarea ref={ref} className={cn('input min-h-24 leading-relaxed', className)} {...rest} />
    </label>
  );
});
