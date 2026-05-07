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
  const e = db
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
    .where(eq(schema.albumEntries.id, id))
    .get();
  if (!e) return NextResponse.json(fail('不存在'), { status: 404 });
  const photos = db
    .select()
    .from(schema.albumPhotos)
    .where(eq(schema.albumPhotos.entryId, id))
    .orderBy(schema.albumPhotos.sortOrder)
    .all();
  return NextResponse.json(ok({ ...e, photos: photos.map((p) => ({ path: p.path, width: p.width, height: p.height })) }));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });

  const e = db.select().from(schema.albumEntries).where(eq(schema.albumEntries.id, id)).get();
  if (!e) return NextResponse.json(fail('不存在'), { status: 404 });
  if (e.authorId !== s.uid) return NextResponse.json(fail('只能删除自己的相册条目'), { status: 403 });

  const photos = db.select().from(schema.albumPhotos).where(eq(schema.albumPhotos.entryId, id)).all();
  db.delete(schema.albumEntries).where(eq(schema.albumEntries.id, id)).run();
  await Promise.all(photos.map((p) => deletePhotoFile(p.path)));
  return NextResponse.json(ok(null));
}
