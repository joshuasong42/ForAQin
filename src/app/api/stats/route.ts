import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, sqlite, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';
import { todayShanghai } from '@/lib/dates';

export const runtime = 'nodejs';

function count(sql: string): number {
  return (sqlite.prepare(sql).get() as { c: number }).c;
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  const counts = {
    messages: count('SELECT COUNT(*) as c FROM messages'),
    photos:
      count('SELECT COUNT(*) as c FROM message_photos') +
      count('SELECT COUNT(*) as c FROM album_photos') +
      count('SELECT COUNT(*) as c FROM capsule_photos'),
    capsules: count('SELECT COUNT(*) as c FROM capsules'),
    wishes: count('SELECT COUNT(*) as c FROM wishes'),
    wishesDone: count('SELECT COUNT(*) as c FROM wishes WHERE completed=1'),
    moods: count('SELECT COUNT(*) as c FROM moods'),
    earliestMessage: (sqlite.prepare('SELECT MIN(created_at) as t FROM messages').get() as { t: number | null })
      .t,
  };

  const today = todayShanghai();
  const todayMoods = db
    .select({
      authorId: schema.moods.authorId,
      authorName: schema.users.displayName,
      mood: schema.moods.mood,
      note: schema.moods.note,
    })
    .from(schema.moods)
    .leftJoin(schema.users, eq(schema.users.id, schema.moods.authorId))
    .where(eq(schema.moods.logDate, today))
    .all();

  const lc = db.select().from(schema.kv).where(eq(schema.kv.key, 'love_count')).get();
  const loveCount = lc ? Number.parseInt(lc.value, 10) || 0 : 0;

  const users = db.select().from(schema.users).orderBy(asc(schema.users.id)).all();

  return NextResponse.json(
    ok({
      counts,
      todayMoods,
      loveCount,
      users: users.map((u) => ({ id: u.id, username: u.username, name: u.displayName, avatar: u.avatar })),
      me: { id: s.uid, name: s.name, username: s.uname },
    })
  );
}
