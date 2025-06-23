// File: /middleware.ts
//
// OBJETIVO PRINCIPAL:
// 1. Manejo de internacionalización (i18n) para rutas.
// 2. Redirecciones optimistas para una mejor UX (ej. a /auth/signin si no está autenticado).
// 3. MITIGACIÓN TEMPRANA de cabeceras maliciosas (ej. x-middleware-subrequest).
//
// ADVERTENCIA DE SEGURIDAD CRÍTICA:
// El middleware NO es la barrera de seguridad principal.
// La autenticación y autorización robusta deben implementarse en:
// - Tus Server Components (usando getServerSession o lógica de sesión/token)
// - Tus API Routes (validando tokens/sesiones para cada solicitud)
// - Tus Server Actions (validando la sesión/autorización antes de ejecutar la lógica)
// - **TU DATA ACCESS LAYER (DAL)**: Esto es FUNDAMENTAL para garantizar que un usuario
//   solo pueda acceder a los datos a los que está autorizado, especialmente en un entorno multi-tenant.
//   Aquí se aplica la lógica de tenant ID y permisos de usuario.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '../auth'; // Asegúrate de que 'auth' esté configurado correctamente

// --- Configuración de Internacionalización (i18n) ---
const locales = ['es', 'en']; // Idiomas soportados por tu aplicación
const defaultLocale = 'es';   // Idioma por defecto

// --- Rutas Públicas (acceso sin autenticación) ---
// IMPORTANT: Estas rutas son solo para redirecciones optimistas en el middleware.
// Aun así, la lógica de autenticación real de estas páginas (ej. registro, login)
// debe manejar la sesión de forma segura y validar las credenciales en el backend.
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// --- Funciones Auxiliares ---

// Determina el locale a usar (aquí simplificado, puedes usar `accept-language` header para más inteligencia)
function getLocale(request: NextRequest): string {
  // Aquí podrías implementar lógica más sofisticada para detectar el idioma
  // basándote en el header 'Accept-Language' o cookies.
  return defaultLocale;
}

// Extrae el pathname sin el prefijo del locale
function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');
  if (locales.includes(segments[1])) {
    return '/' + segments.slice(2).join('/'); // /es/dashboard -> /dashboard
  }
  return pathname; // Si no tiene locale, lo devuelve tal cual
}

// --- Lógica Principal del Middleware ---
export default auth((request: NextRequest & { auth: any }) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.auth; // 'request.auth' viene de next-auth o tu solución similar

  // --- 1. Mitigación de Cabeceras Maliciosas (CVE-2025-29927 y defensa en profundidad) ---
  // Clonar los headers para modificarlos de forma segura.
  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.delete('x-middleware-subrequest');
  modifiedHeaders.delete('x-forwarded-middleware');
  // Considera eliminar cualquier otro header interno que no deba exponerse o manipularse.

  // Recrear la solicitud con los headers limpios.
  // IMPORTANTE: Si el body de la solicitud va a ser leído más adelante (ej. en una API route POST),
  // y ya ha sido leído por alguna lógica en este middleware, necesitarás clonar el body Stream.
  // Para la eliminación de headers, normalmente no se consume el body aquí.
  const cleanRequest = new Request(request.url, {
    method: request.method,
    headers: modifiedHeaders,
    body: request.body, // Pasa el body original si no lo has consumido
    duplex: 'half', // Necesario para 'POST' requests si pasas 'body'
  });

  // --- 2. Manejo de Internacionalización (i18n) ---
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  const currentLocale = pathnameHasLocale
    ? pathname.split('/')[1]
    : getLocale(request); // Si la URL no tiene locale, detecta uno

  // Redirige si la URL no tiene un locale (ej. /dashboard -> /es/dashboard)
  if (!pathnameHasLocale) {
    const newUrl = new URL(`/${currentLocale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Obtiene el pathname sin el locale para las comprobaciones de ruta
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // --- 3. Lógica de Redirección Optimista (UX) ---
  const isPublicRoute = publicRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (!isPublicRoute && !isAuthenticated) {
    // Si no es una ruta pública Y el usuario NO está autenticado,
    // redirige optimista y rápidamente a la página de inicio de sesión.
    // Esta es una medida de UX, no de seguridad infranqueable.
    const loginUrl = new URL(`/${currentLocale}/auth/signin`, request.url);
    // Guarda la URL original para redirigir después del login (validar esto en el login!)
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && isAuthenticated) {
    // Si es una ruta pública (ej. login, registro) Y el usuario SÍ está autenticado,
    // redirige a una página interna (ej. dashboard) para mejorar la UX.
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url));
  }

  // --- 4. Añadir Cabeceras de Seguridad a la Respuesta (Defensa en Profundidad) ---
  const response = NextResponse.next(); // Continúa con la solicitud original o la solicitud limpia si se modificó.

  // Añade headers HTTP para endurecer la seguridad del navegador.
  response.headers.set('X-Frame-Options', 'DENY');           // Previene Clickjacking
  response.headers.set('X-Content-Type-Options', 'nosniff'); // Previene MIME-sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // Controla el header Referer
  response.headers.set('X-XSS-Protection', '1; mode=block'); // Habilita la protección XSS en navegadores antiguos
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'); // HSTS para HTTPS

  // Asegúrate de que ninguna cabecera interna potencialmente peligrosa sea pasada a la respuesta del cliente.
  response.headers.delete('x-middleware-subrequest');
  response.headers.delete('x-forwarded-middleware'); // Por si acaso también en la respuesta

  // Si usaste 'cleanRequest' para procesar, asegúrate de devolver su respuesta.
  // En este caso, como solo modificamos headers, 'NextResponse.next()' está bien.
  return response;
});

// --- Configuración del Matcher ---
// El matcher define qué rutas se ejecutarán a través de este middleware.
export const config = {
  matcher: [
    // 1. Excluye archivos y directorios internos de Next.js, API routes, estáticos, etc.
    // Esto es crucial para no aplicar el middleware a recursos que no lo necesitan
    // y evitar problemas de rendimiento o bucles de redirección.
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)',
    //
    // Ejemplo de matchers más específicos si fuera necesario:
    // '/:locale/:path*', // Aplica a todas las rutas con un locale
    // '/:path*',         // Aplica a todas las rutas sin un locale (para la redirección inicial)
  ],
};