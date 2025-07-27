

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/events', '/schedule', '/trips', '/admin'];
const memberOnlyRoutes = ['/profile'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get('da_bois_session')?.value;
  const { pathname } = request.nextUrl;


  // If user is trying to access a protected route without a session, redirect to login
  if (!session && (protectedRoutes.some(route => pathname.startsWith(route)) || memberOnlyRoutes.some(route => pathname.startsWith(route)))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access an auth route, redirect to dashboard
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // A parent trying to access member-only route should be redirected
  // We can't check role directly here, so we'll rely on server components to handle role-based UI,
  // but we can add a check in the server actions for mutations.

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
