import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  // Completely disable CSP in development
  if (process.env.NODE_ENV === 'development') {
    // Remove any CSP headers
    response.headers.delete('content-security-policy')
    response.headers.delete('content-security-policy-report-only')

    // Add permissive headers for development
    response.headers.set('x-frame-options', 'SAMEORIGIN')
    response.headers.set('x-content-type-options', 'nosniff')
  }

  return response
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
}
