import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, schema } from './db/client';
import {
  signSession,
  verifySession,
  SESSION_COOKIE_NAME,
  SEVEN_DAYS,
  type SessionPayload,
} from './session';

export type { SessionPayload } from './session';
export { signSession, verifySession, SESSION_COOKIE_NAME } from './session';

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const tok = c.get(SESSION_COOKIE_NAME)?.value;
  if (!tok) return null;
  return verifySession(tok);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    // 默认仅在生产环境启用 Secure；裸 HTTP 部署可设 COOKIE_SECURE=false 临时关闭
    secure: process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(SESSION_COOKIE_NAME);
}

export async function authenticate(username: string, password: string) {
  const u = db.select().from(schema.users).where(eq(schema.users.username, username)).get();
  if (!u) return null;
  const ok = bcrypt.compareSync(password, u.passwordHash);
  if (!ok) return null;
  return u;
}
