import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const now = Date.now();

  // Only return id/title/unlock_at/locked + author for the list view.
  // Content & photos are intentionally NOT included for locked items.
  const rows = db
    .select({
      id: schema.capsules.id,
      title: schema.capsules.title,
      unlockAt: schema.capsules.unlockAt,
      authorId: schema.capsules.authorId,
      createdAt: schema.capsules.createdAt,
      authorName: schema.users.displayName,
    })
    .from(schema.capsules)
    .leftJoin(schema.users, eq(schema.users.id, schema.capsules.authorId))
    .orderBy(desc(schema.capsules.createdAt))
    .all();

  return NextResponse.json(
    ok(
      rows.map((r) => ({
        ...r,
        locked: r.unlockAt > now,
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
    unlockAt?: string; // YYYY-MM-DD
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
  if (!title) return NextResponse.json(fail('请填写标题'), { status: 400 });
  if (!content) return NextResponse.json(fail('请写下要封存的内容'), { status: 400 });
  if (!body.unlockAt) return NextResponse.json(fail('请选择解锁日期'), { status: 400 });
  const unlockTs = new Date(body.unlockAt + 'T00:00:00').getTime();
  if (!Number.isFinite(unlockTs)) return NextResponse.json(fail('日期格式错误'), { status: 400 });
  if (photos.length > 9) return NextResponse.json(fail('最多 9 张图片'), { status: 400 });

  const now = Date.now();
  const inserted = db
    .insert(schema.capsules)
    .values({ authorId: s.uid, title, content, unlockAt: unlockTs, createdAt: now })
    .returning()
    .get();

  if (photos.length) {
    db.insert(schema.capsulePhotos)
      .values(photos.map((p, i) => ({ capsuleId: inserted.id, path: p.path, width: p.width, height: p.height, sortOrder: i })))
      .run();
  }

  return NextResponse.json(ok({ id: inserted.id }));
}
