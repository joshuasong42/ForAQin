import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { ok } from '@/lib/utils';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json(ok(null));
}
