import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['es', 'en']
const defaultLocale = 'es'

function getLocale(request: NextRequest): string {
  // You can add logic here to detect user's preferred language
  // For now, just return default
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if pathname already has a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If pathname has locale, continue normally
  if (pathnameHasLocale) return

  // If no locale in pathname, redirect to default locale
  const locale = getLocale(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  
  return NextResponse.redirect(newUrl)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, _static, api, favicon, etc.)
    '/((?!_next|_static|api|favicon.ico|.*\\..*).*)',
  ],
}