import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const rows = db.select().from(schema.anniversaries).all();
  return NextResponse.json(ok(rows));
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  let body: {
    title?: string;
    date?: string; // YYYY-MM-DD (year ignored when repeat_yearly)
    isLunar?: boolean;
    repeatYearly?: boolean;
    emoji?: string;
    color?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  const title = (body.title || '').trim();
  const date = (body.date || '').trim();
  if (!title) return NextResponse.json(fail('请填写名称'), { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json(fail('请选择日期'), { status: 400 });

  db.insert(schema.anniversaries)
    .values({
      title,
      date,
      isLunar: body.isLunar ? 1 : 0,
      repeatYearly: body.repeatYearly === false ? 0 : 1,
      emoji: body.emoji || null,
      color: body.color || '#a896c4',
      createdAt: Date.now(),
    })
    .run();

  return NextResponse.json(ok(null));
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });
  const idStr = req.nextUrl.searchParams.get('id');
  const id = idStr ? Number.parseInt(idStr, 10) : NaN;
  if (!Number.isFinite(id)) return NextResponse.json(fail('参数错误'), { status: 400 });
  db.delete(schema.anniversaries).where(eq(schema.anniversaries.id, id)).run();
  return NextResponse.json(ok(null));
}
