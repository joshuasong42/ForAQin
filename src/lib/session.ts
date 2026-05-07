// JWT helpers usable from both Edge middleware and Node route handlers.
// Must NOT import the DB or any node-only modules.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'sp_session';
export const SEVEN_DAYS = 60 * 60 * 24 * 7;

export type SessionPayload = { uid: number; uname: string; name: string };

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET 未设置或太短 (>=16 字符)');
  }
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.uid === 'number' &&
      typeof payload.uname === 'string' &&
      typeof payload.name === 'string'
    ) {
      return { uid: payload.uid, uname: payload.uname, name: payload.name };
    }
    return null;
  } catch {
    return null;
  }
}
