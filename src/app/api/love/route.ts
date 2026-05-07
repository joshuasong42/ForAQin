import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const lc = db.select().from(schema.kv).where(eq(schema.kv.key, 'love_count')).get();
  const v = lc ? Number.parseInt(lc.value, 10) || 0 : 0;
  return NextResponse.json(ok({ count: v }));
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  let body: { delta?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  // throttle: max +50 per request (client batches)
  const delta = Math.min(Math.max(Number.parseInt(String(body.delta || 0), 10) || 0, 0), 50);

  const lc = db.select().from(schema.kv).where(eq(schema.kv.key, 'love_count')).get();
  const cur = lc ? Number.parseInt(lc.value, 10) || 0 : 0;
  const next = cur + delta;
  if (lc) {
    db.update(schema.kv).set({ value: String(next), updatedAt: Date.now() }).where(eq(schema.kv.key, 'love_count')).run();
  } else {
    db.insert(schema.kv).values({ key: 'love_count', value: String(next), updatedAt: Date.now() }).run();
  }
  return NextResponse.json(ok({ count: next }));
}
