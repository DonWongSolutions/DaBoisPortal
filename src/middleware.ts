

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/events', '/schedule', '/trips', '/admin', '/wiki/edit', '/wiki/new'];
const authRoutes = ['/login'];
const publicRoutes = ['/wiki'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get('da_bois_session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route) && (pathname === route || pathname.startsWith(route + '/')));
  if (isPublicRoute && !pathname.includes('/edit') && !pathname.includes('/new')) {
    return NextResponse.next();
  }

  // If user is trying to access a protected route without a session, redirect to login
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access an auth route, redirect to dashboard
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
