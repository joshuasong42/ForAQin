import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { deletePhotoFile } from '@/lib/upload';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });

  const m = db.select().from(schema.messages).where(eq(schema.messages.id, id)).get();
  if (!m) return NextResponse.json(fail('留言不存在'), { status: 404 });
  if (m.authorId !== s.uid) return NextResponse.json(fail('只能删除自己的留言'), { status: 403 });

  // gather photos to remove from disk
  const photos = db.select().from(schema.messagePhotos).where(eq(schema.messagePhotos.messageId, id)).all();
  // delete row (cascade removes photo rows)
  db.delete(schema.messages).where(eq(schema.messages.id, id)).run();
  await Promise.all(photos.map((p) => deletePhotoFile(p.path)));
  return NextResponse.json(ok(null));
}
