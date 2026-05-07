import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { ok, fail } from '@/lib/utils';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const u = db.select().from(schema.users).where(eq(schema.users.id, s.uid)).get();
  if (!u) return NextResponse.json(fail('用户不存在'), { status: 404 });
  return NextResponse.json(
    ok({ id: u.id, username: u.username, name: u.displayName, avatar: u.avatar })
  );
}
