import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const rows = db
    .select({
      id: schema.wishes.id,
      content: schema.wishes.content,
      completed: schema.wishes.completed,
      completedAt: schema.wishes.completedAt,
      coverPhoto: schema.wishes.coverPhoto,
      createdAt: schema.wishes.createdAt,
      authorId: schema.wishes.authorId,
      authorName: schema.users.displayName,
    })
    .from(schema.wishes)
    .leftJoin(schema.users, eq(schema.users.id, schema.wishes.authorId))
    .orderBy(desc(schema.wishes.createdAt))
    .all();
  return NextResponse.json(ok(rows));
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  const content = (body.content || '').trim();
  if (!content) return NextResponse.json(fail('请填写心愿'), { status: 400 });
  if (content.length > 500) return NextResponse.json(fail('内容太长'), { status: 400 });
  db.insert(schema.wishes)
    .values({ authorId: s.uid, content, completed: 0, createdAt: Date.now() })
    .run();
  return NextResponse.json(ok(null));
}
