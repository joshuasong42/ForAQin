import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { todayShanghai } from '@/lib/dates';
import { ok, fail } from '@/lib/utils';
import { MOODS } from '@/lib/const';

export const runtime = 'nodejs';

const VALID_MOODS = new Set(MOODS.map((m) => m.key));

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  // return latest 60 entries with author names
  const rows = db
    .select({
      id: schema.moods.id,
      mood: schema.moods.mood,
      note: schema.moods.note,
      logDate: schema.moods.logDate,
      createdAt: schema.moods.createdAt,
      authorId: schema.moods.authorId,
      authorName: schema.users.displayName,
    })
    .from(schema.moods)
    .leftJoin(schema.users, eq(schema.users.id, schema.moods.authorId))
    .orderBy(desc(schema.moods.createdAt))
    .limit(60)
    .all();

  // Today's mood from current user
  const today = todayShanghai();
  const mine = db
    .select()
    .from(schema.moods)
    .where(and(eq(schema.moods.authorId, s.uid), eq(schema.moods.logDate, today)))
    .get();

  return NextResponse.json(ok({ list: rows, mineToday: mine || null }));
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  let body: { mood?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  const mood = (body.mood || '').trim();
  const note = (body.note || '').trim().slice(0, 200);
  if (!VALID_MOODS.has(mood)) return NextResponse.json(fail('请选择心情'), { status: 400 });

  const today = todayShanghai();
  const existing = db
    .select()
    .from(schema.moods)
    .where(and(eq(schema.moods.authorId, s.uid), eq(schema.moods.logDate, today)))
    .get();
  if (existing) {
    db.update(schema.moods)
      .set({ mood, note, createdAt: Date.now() })
      .where(eq(schema.moods.id, existing.id))
      .run();
  } else {
    db.insert(schema.moods)
      .values({ authorId: s.uid, mood, note, logDate: today, createdAt: Date.now() })
      .run();
  }
  return NextResponse.json(ok(null));
}
