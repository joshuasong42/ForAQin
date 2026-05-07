import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  const rows = db
    .select({
      id: schema.albumEntries.id,
      title: schema.albumEntries.title,
      content: schema.albumEntries.content,
      takenAt: schema.albumEntries.takenAt,
      createdAt: schema.albumEntries.createdAt,
      authorId: schema.albumEntries.authorId,
      authorName: schema.users.displayName,
    })
    .from(schema.albumEntries)
    .leftJoin(schema.users, eq(schema.users.id, schema.albumEntries.authorId))
    .orderBy(desc(schema.albumEntries.takenAt))
    .all();

  const ids = rows.map((r) => r.id);
  const photos = ids.length
    ? db
        .select()
        .from(schema.albumPhotos)
        .where(inArray(schema.albumPhotos.entryId, ids))
        .orderBy(schema.albumPhotos.sortOrder)
        .all()
    : [];

  const map = new Map<number, typeof photos>();
  for (const p of photos) {
    const arr = map.get(p.entryId) || [];
    arr.push(p);
    map.set(p.entryId, arr);
  }

  return NextResponse.json(
    ok(
      rows.map((r) => ({
        ...r,
        photos: (map.get(r.id) || []).map((p) => ({ path: p.path, width: p.width, height: p.height })),
      }))
    )
  );
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  let body: {
    title?: string;
    content?: string;
    takenAt?: string; // YYYY-MM-DD
    photos?: { path: string; width: number; height: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }

  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  const photos = body.photos || [];
  const takenAt = body.takenAt ? new Date(body.takenAt).getTime() : Date.now();
  if (!title) return NextResponse.json(fail('请填写标题'), { status: 400 });
  if (photos.length > 12) return NextResponse.json(fail('最多 12 张图片'), { status: 400 });

  const now = Date.now();
  const inserted = db
    .insert(schema.albumEntries)
    .values({ authorId: s.uid, title, content, takenAt: Number.isFinite(takenAt) ? takenAt : now, createdAt: now })
    .returning()
    .get();

  if (photos.length) {
    db.insert(schema.albumPhotos)
      .values(photos.map((p, i) => ({ entryId: inserted.id, path: p.path, width: p.width, height: p.height, sortOrder: i })))
      .run();
  }
  return NextResponse.json(ok({ id: inserted.id }));
}
