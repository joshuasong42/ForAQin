import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
];

const PUBLIC_PREFIXES = [
  '/_next',
  '/icons',
  '/fonts',
  '/favicon',
  '/manifest',
  '/robots.txt',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }
  for (const p of PUBLIC_PREFIXES) {
    if (pathname.startsWith(p)) return NextResponse.next();
  }
  // /uploads/* served by nginx in prod, by Next dev server in dev (we keep them
  // public on purpose - they're already private behind login as the file paths
  // contain uuids)
  if (pathname.startsWith('/uploads/')) return NextResponse.next();

  const tok = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = tok ? await verifySession(tok) : null;

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // every path except the explicit static asset prefixes
    '/((?!_next/static|_next/image|favicon.ico|icons|fonts).*)',
  ],
};
