import { NextRequest, NextResponse } from 'next/server';
import { authenticate, signSession, setSessionCookie } from '@/lib/auth';
import { ok, fail } from '@/lib/utils';

// 简单的 IP 内存级速率限制：5 次失败 / 分钟 / IP
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_FAILURES = 5;

function clientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function takeRate(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= MAX_FAILURES) return false;
  return true;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  b.count += 1;
  buckets.set(ip, b);
}

function resetFailure(ip: string) {
  buckets.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!takeRate(ip)) {
    return NextResponse.json(fail('登录尝试过于频繁，请 1 分钟后再试'), { status: 429 });
  }
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail('请求格式错误'), { status: 400 });
  }
  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(fail('请填写用户名和密码'), { status: 400 });
  }
  const u = await authenticate(username.trim(), password);
  if (!u) {
    recordFailure(ip);
    return NextResponse.json(fail('用户名或密码错误'), { status: 401 });
  }
  resetFailure(ip);
  const tok = await signSession({ uid: u.id, uname: u.username, name: u.displayName });
  await setSessionCookie(tok);
  return NextResponse.json(ok({ id: u.id, username: u.username, name: u.displayName }));
}
