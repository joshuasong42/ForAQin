import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { deletePhotoFile } from '@/lib/upload';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });

  const c = db
    .select({
      id: schema.capsules.id,
      title: schema.capsules.title,
      content: schema.capsules.content,
      unlockAt: schema.capsules.unlockAt,
      authorId: schema.capsules.authorId,
      createdAt: schema.capsules.createdAt,
      authorName: schema.users.displayName,
    })
    .from(schema.capsules)
    .leftJoin(schema.users, eq(schema.users.id, schema.capsules.authorId))
    .where(eq(schema.capsules.id, id))
    .get();
  if (!c) return NextResponse.json(fail('不存在'), { status: 404 });

  const now = Date.now();
  if (c.unlockAt > now) {
    // 服务端兜底：未到时间不返回内容/照片
    return NextResponse.json(
      ok({
        id: c.id,
        title: c.title,
        unlockAt: c.unlockAt,
        authorId: c.authorId,
        authorName: c.authorName,
        createdAt: c.createdAt,
        locked: true,
      })
    );
  }

  const photos = db
    .select()
    .from(schema.capsulePhotos)
    .where(eq(schema.capsulePhotos.capsuleId, id))
    .orderBy(schema.capsulePhotos.sortOrder)
    .all();
  return NextResponse.json(
    ok({
      ...c,
      locked: false,
      photos: photos.map((p) => ({ path: p.path, width: p.width, height: p.height })),
    })
  );
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });
  const c = db.select().from(schema.capsules).where(eq(schema.capsules.id, id)).get();
  if (!c) return NextResponse.json(fail('不存在'), { status: 404 });
  if (c.authorId !== s.uid) return NextResponse.json(fail('只能删除自己的胶囊'), { status: 403 });
  const photos = db.select().from(schema.capsulePhotos).where(eq(schema.capsulePhotos.capsuleId, id)).all();
  db.delete(schema.capsules).where(eq(schema.capsules.id, id)).run();
  await Promise.all(photos.map((p) => deletePhotoFile(p.path)));
  return NextResponse.json(ok(null));
}
