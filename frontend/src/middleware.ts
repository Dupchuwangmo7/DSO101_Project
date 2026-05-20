import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/auth', '/_next', '/api', '/favicon.ico']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = [...PUBLIC_PATHS].some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  if (isPublic) return NextResponse.next();

  // Temporary bypass: allow all routes without auth while login is disabled.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
