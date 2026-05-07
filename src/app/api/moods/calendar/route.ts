import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const ymStr = req.nextUrl.searchParams.get('month'); // YYYY-MM
  const now = new Date();
  let yyyy = now.getFullYear();
  let mm = now.getMonth() + 1;
  if (ymStr && /^\d{4}-\d{2}$/.test(ymStr)) {
    [yyyy, mm] = ymStr.split('-').map((s) => Number.parseInt(s, 10));
  }
  const startStr = `${yyyy}-${String(mm).padStart(2, '0')}-01`;
  const endStr = `${yyyy}-${String(mm).padStart(2, '0')}-31`;

  const rows = db
    .select({
      id: schema.moods.id,
      mood: schema.moods.mood,
      note: schema.moods.note,
      logDate: schema.moods.logDate,
      authorId: schema.moods.authorId,
      authorName: schema.users.displayName,
    })
    .from(schema.moods)
    .leftJoin(schema.users, eq(schema.users.id, schema.moods.authorId))
    .where(and(gte(schema.moods.logDate, startStr), lte(schema.moods.logDate, endStr)))
    .all();

  return NextResponse.json(ok({ year: yyyy, month: mm, items: rows }));
}
