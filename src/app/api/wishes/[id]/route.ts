import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { deletePhotoFile } from '@/lib/upload';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });
  let body: { completed?: boolean; coverPhoto?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }

  const w = db.select().from(schema.wishes).where(eq(schema.wishes.id, id)).get();
  if (!w) return NextResponse.json(fail('不存在'), { status: 404 });

  const completed = body.completed === undefined ? w.completed === 1 : body.completed;
  const coverPhoto = body.coverPhoto === undefined ? w.coverPhoto : body.coverPhoto;

  // If removing the previous cover photo, clean it up
  if (w.coverPhoto && w.coverPhoto !== coverPhoto) {
    deletePhotoFile(w.coverPhoto);
  }

  db.update(schema.wishes)
    .set({
      completed: completed ? 1 : 0,
      completedAt: completed ? Date.now() : null,
      coverPhoto: coverPhoto || null,
    })
    .where(eq(schema.wishes.id, id))
    .run();

  return NextResponse.json(ok(null));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });
  const w = db.select().from(schema.wishes).where(eq(schema.wishes.id, id)).get();
  if (!w) return NextResponse.json(fail('不存在'), { status: 404 });
  if (w.authorId !== s.uid) return NextResponse.json(fail('只能删除自己写的心愿'), { status: 403 });
  if (w.coverPhoto) await deletePhotoFile(w.coverPhoto);
  db.delete(schema.wishes).where(eq(schema.wishes.id, id)).run();
  return NextResponse.json(ok(null));
}
