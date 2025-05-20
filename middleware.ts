import { withAuth } from 'next-auth/middleware';

// Protect all API routes and all frontend pages (except login, NextAuth handlers, and static assets)
export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    // Protect all API routes
    '/api/:path*',
    // Protect all pages except login page, NextAuth routes, and _next static files
    '/((?!login|api/auth|_next|favicon.ico).*)',
  ],
};
