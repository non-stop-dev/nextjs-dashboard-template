import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '../auth'

const locales = ['es', 'en']
const defaultLocale = 'es'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings']
// Public routes accessible without authentication
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password']

function getLocale(request: NextRequest): string {
  // You can add logic here to detect user's preferred language
  // For now, just return default
  return defaultLocale
}

function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/')
  if (locales.includes(segments[1])) {
    return '/' + segments.slice(2).join('/')
  }
  return pathname
}

export default auth((request: NextRequest & { auth: any }) => {
  const { pathname } = request.nextUrl
  const isAuthenticated = !!request.auth
  
  // Check if pathname already has a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Get current locale or default
  const currentLocale = pathnameHasLocale 
    ? pathname.split('/')[1] 
    : getLocale(request)

  // Handle i18n redirect first
  if (!pathnameHasLocale) {
    const newUrl = new URL(`/${currentLocale}${pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  // Get pathname without locale for auth checks
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
  
  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathnameWithoutLocale.startsWith(route)
  )
  
  // Check if current route is auth route
  const isAuthRoute = authRoutes.some(route => 
    pathnameWithoutLocale.startsWith(route)
  )

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL(`/${currentLocale}/auth/signin`, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip all internal paths (_next, _static, api, favicon, etc.)
    '/((?!_next|_static|api|favicon.ico|.*\\..*).*)',
  ],
}