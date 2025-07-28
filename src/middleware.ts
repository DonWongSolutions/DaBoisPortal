
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsers } from '@/lib/data';

const protectedRoutes = ['/dashboard', '/events', '/schedule', '/trips', '/admin', '/chat', '/linkboard'];
const memberOnlyRoutes = ['/profile'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('da_bois_session');
  const sessionUser = sessionCookie?.value;
  const { pathname } = request.nextUrl;

  // If user is trying to access a protected route without a session, redirect to login
  if (!sessionUser && (protectedRoutes.some(route => pathname.startsWith(route)) || memberOnlyRoutes.some(route => pathname.startsWith(route)))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated
  if (sessionUser) {
    // If user is on an auth route, redirect to dashboard
    if (authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Check for verification flags
    const users = await getUsers();
    const user = users.find(u => u.name === sessionUser);

    if (user && (user.forceInfoUpdate || user.forcePasswordChange)) {
      // If flags are set, they can only access the profile page
      if (pathname !== '/profile') {
        return NextResponse.redirect(new URL('/profile', request.url));
      }
    }
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
