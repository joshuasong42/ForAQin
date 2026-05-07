import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ApiResp<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): ApiResp<T> {
  return { ok: true, data };
}

export function fail(error: string): ApiResp {
  return { ok: false, error };
}
