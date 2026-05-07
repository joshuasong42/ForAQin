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
      id: schema.messages.id,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
      authorId: schema.messages.authorId,
      authorName: schema.users.displayName,
      authorUsername: schema.users.username,
    })
    .from(schema.messages)
    .leftJoin(schema.users, eq(schema.users.id, schema.messages.authorId))
    .orderBy(desc(schema.messages.createdAt))
    .all();

  const ids = rows.map((r) => r.id);
  const photos = ids.length
    ? db
        .select()
        .from(schema.messagePhotos)
        .where(inArray(schema.messagePhotos.messageId, ids))
        .orderBy(schema.messagePhotos.sortOrder)
        .all()
    : [];

  const byMsg = new Map<number, typeof photos>();
  for (const p of photos) {
    const arr = byMsg.get(p.messageId) || [];
    arr.push(p);
    byMsg.set(p.messageId, arr);
  }

  return NextResponse.json(
    ok(
      rows.map((r) => ({
        ...r,
        photos: (byMsg.get(r.id) || []).map((p) => ({ path: p.path, width: p.width, height: p.height })),
      }))
    )
  );
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  let body: { content?: string; photos?: { path: string; width: number; height: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  const content = (body.content || '').trim();
  const photos = body.photos || [];
  if (!content && photos.length === 0) {
    return NextResponse.json(fail('请输入内容或添加照片'), { status: 400 });
  }
  if (content.length > 5000) return NextResponse.json(fail('内容太长'), { status: 400 });
  if (photos.length > 9) return NextResponse.json(fail('最多 9 张图片'), { status: 400 });

  const now = Date.now();
  const inserted = db
    .insert(schema.messages)
    .values({ authorId: s.uid, content, createdAt: now })
    .returning()
    .get();

  if (photos.length) {
    const rows = photos.map((p, i) => ({
      messageId: inserted.id,
      path: p.path,
      width: p.width,
      height: p.height,
      sortOrder: i,
    }));
    db.insert(schema.messagePhotos).values(rows).run();
  }
  return NextResponse.json(ok({ id: inserted.id }));
}
