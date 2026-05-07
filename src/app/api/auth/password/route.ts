import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db/client';
import { ok, fail } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  let body: { oldPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求错误'), { status: 400 });
  }
  const { oldPassword, newPassword } = body;
  if (!oldPassword || !newPassword) return NextResponse.json(fail('参数不全'), { status: 400 });
  if (newPassword.length < 6) return NextResponse.json(fail('新密码至少 6 位'), { status: 400 });

  const u = db.select().from(schema.users).where(eq(schema.users.id, s.uid)).get();
  if (!u) return NextResponse.json(fail('用户不存在'), { status: 404 });

  if (!bcrypt.compareSync(oldPassword, u.passwordHash)) {
    return NextResponse.json(fail('原密码错误'), { status: 400 });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.update(schema.users).set({ passwordHash: newHash }).where(eq(schema.users.id, s.uid)).run();

  return NextResponse.json(ok(null));
}
