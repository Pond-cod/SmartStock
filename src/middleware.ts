import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // ── Public paths — no auth required ──────────────────────────────────────
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/health');

  if (isPublicPath) {
    // If already logged in, redirect away from login page
    if (token && pathname.startsWith('/login')) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Invalid token — let them log in again
      }
    }
    return NextResponse.next();
  }

  // ── Protected paths — require valid JWT ───────────────────────────────────
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    const role = payload.role as string;

    // Page-level RBAC (API-level RBAC is enforced separately in route handlers)
    if (pathname.startsWith('/users') || pathname.startsWith('/settings')) {
      if (role !== 'Admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired — clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
