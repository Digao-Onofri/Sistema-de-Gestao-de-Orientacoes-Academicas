import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('sgoa_session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/login');
  const isProtected = pathname.startsWith('/dashboard') || 
                      pathname.startsWith('/usuarios') || 
                      pathname.startsWith('/cursos') || 
                      pathname.startsWith('/unidades');

  if (isProtected && !sessionToken) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionToken) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
