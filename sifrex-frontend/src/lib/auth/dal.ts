// File: /src/lib/dal.ts
// Data Access Layer - PRIMARY SECURITY BOUNDARY
// All data access MUST go through this layer for enterprise security

'use server'

import { auth } from '@/../auth' // Asegúrate de que esta ruta sea correcta
import { prisma } from '@/lib/auth/prisma' // Asegúrate de que esta ruta sea correcta
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/auth/definitions' // Asegúrate de que esta ruta sea correcta y el tipo User esté bien definido
import { Role } from '@prisma/client'

/**
 * CRITICAL: This is your PRIMARY security boundary
 * After CVE-2025-29927, middleware is NOT reliable for security
 * All sensitive data access MUST verify auth here
 */

// Cache the session verification for performance
export const verifySession = cache(async () => {
  console.log('DAL: verifySession called');

  // --- LÓGICA DE BYPASS PARA DESARROLLO (NUNCA EN PRODUCCIÓN) ---
  // STRICT security conditions to prevent accidental production bypass
  const isDevelopmentBypass = (
    process.env.NODE_ENV === 'development' && 
    process.env.DEV_DAL_BYPASS === 'true' &&
    process.env.DATABASE_URL?.includes('localhost') && // Must be local DB
    !process.env.VERCEL_ENV && // Not on Vercel
    !process.env.RAILWAY_ENVIRONMENT && // Not on Railway
    !process.env.HEROKU_APP_NAME // Not on Heroku
  );
  
  if (isDevelopmentBypass) {
    // En este escenario, como no hay DB conectada, estos son IDs/emails simulados en memoria.
    const devUserId = process.env.DEV_USER_ID || 'dev-dal-user-id-default';
    const devUserEmail = process.env.DEV_USER_EMAIL || 'dev-dal-default@example.com';
    const devUserRole = (process.env.DEV_USER_ROLE as 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN') || 'ADMIN';

    console.log(`DAL: Bypass activo. Sesión inyectada para User ID: ${devUserId}, Email: ${devUserEmail}`);
    return {
      isAuth: true,
      userId: devUserId,
      userEmail: devUserEmail,
      userRole: devUserRole,
    };
  }
  // --- FIN LÓGICA DE BYPASS PARA DESARROLLO ---

  // Lógica normal de verificación de sesión para PRODUCCIÓN (y desarrollo si bypass no activo)
  const session = await auth(); // NextAuth.js session

  if (!session?.user?.id) {
    console.log('DAL: verifySession - No session found. Redirecting to /es/auth/signin');
    redirect('/es/signin'); // Redirige a la página de login con el locale correcto
  }

  console.log('DAL: verifySession - Sesión válida para usuario:', session.user.id);
  return {
    isAuth: true,
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role as 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN', // Asegura el tipo del rol
  };
});

/**
 * Get current user data with full authorization check
 * This is the ONLY way to get user data - never bypass this
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await verifySession();

  // Cuando no hay DB conectada, la consulta a Prisma fallará.
  // Para desarrollo, podemos devolver un objeto User simulado directamente aquí.
  if (process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true' && !prisma) {
      console.warn(`DAL: getCurrentUser - No DB connected or bypass active. Returning simulated user.`);
      return {
          id: userId,
          name: 'Dev Bypass User',
          email: (process.env.DEV_USER_EMAIL as string) || 'dev-dal-default@example.com',
          role: (process.env.DEV_USER_ROLE as 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN') || 'ADMIN',
      } as User;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Nunca devolver contraseña o campos sensibles aquí
      },
    });

    // Este if se activa si el usuario no existe en la DB real (cuando ya esté conectada)
    if (!user && process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true') {
        console.warn(`DAL: getCurrentUser - Usuario con ID inyectado '${userId}' no encontrado en DB real.`);
        // Para desarrollo, podrías devolver un objeto User simulado si el usuario no existe en DB,
        // O simplemente devolver null, lo que podría afectar los componentes que esperan un usuario real.
        return {
            id: userId,
            name: 'Dev Bypass User (from DB check)',
            email: (process.env.DEV_USER_EMAIL as string) || 'dev-dal-default@example.com',
            role: (process.env.DEV_USER_ROLE as 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN') || 'ADMIN',
        } as User;
    }


    return user as User | null;
  } catch (error) {
    console.error('DAL: getCurrentUser error (DB not connected or query failed):', error);
    // Si la DB no está conectada, esto se disparará.
    // En desarrollo con bypass, podríamos simular el éxito, pero si hay un error real de DB, es importante.
    return null;
  }
}

/**
 * Check if user has required role
 * Use this for role-based access control (RBAC)
 */
export async function requireRole(requiredRole: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN') {
  const { userRole } = await verifySession(); // verifySession ya maneja bypass

  const roleHierarchy = {
    'BASIC': 0,
    'PLUS': 1,
    'PREMIUM': 2,
    'PREMIUM_PLUS': 3,
    'ADMIN': 4,
    'SUPER_ADMIN': 5,
  };

  // Asegura que userRole es un tipo válido antes de acceder a roleHierarchy
  if (!Object.keys(roleHierarchy).includes(userRole)) {
    console.warn(`DAL: requireRole - Rol de usuario desconocido: ${userRole}. Redirigiendo a /unauthorized.`);
    redirect('/unauthorized'); // O un error más específico
  }

  if (roleHierarchy[userRole as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
    console.warn(`DAL: requireRole - Usuario con rol '<span class="math-inline">\{userRole\}' intentó acceder a recurso de rol '</span>{requiredRole}'. Redirigiendo a /unauthorized.`);
    redirect('/unauthorized');
  }

  return true;
}

/**
 * Multi-tenant data access pattern
 * For SaaS with tenant isolation
 */
export async function getUserTenantData(tenantId: string) {
  const { userId } = await verifySession(); // verifySession ya maneja bypass

  // Cuando no hay DB conectada, la consulta a Prisma fallará.
  // Para desarrollo con bypass, podemos simular que el usuario tiene acceso al tenant.
  if (process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true' && !prisma) {
      console.warn(`DAL: getUserTenantData - No DB connected or bypass active. Simulating tenant access.`);
      return { userId, tenantId };
  }

  // Verify user belongs to this tenant
  const userTenant = await prisma.user.findFirst({
    where: {
      id: userId,
      // !!! IMPORTANTE: Implementa tu lógica de relación de tenant aquí !!!
      // Por ejemplo, si tu modelo User tiene un campo 'tenantId'
      // tenantId: tenantId
      // O si hay una tabla intermedia de UserTenant
      // userTenants: { some: { tenantId: tenantId } }
    },
    select: { id: true }
  });

  if (!userTenant) {
    console.warn(`DAL: getUserTenantData - Usuario '<span class="math-inline">\{userId\}' no tiene acceso al tenant '</span>{tenantId}'. Redirigiendo a /unauthorized.`);
    redirect('/unauthorized');
  }

  // Ahora es seguro devolver datos específicos del tenant
  return {
    userId,
    tenantId,
    // ... datos específicos del tenant que obtengas de la DB
  };
}

/**
 * Secure data fetching template
 * Use this pattern for ALL sensitive data access
 */
export async function getSecureData<T>(
  dataFetcher: (userId: string) => Promise<T>
): Promise<T> {
  const { userId } = await verifySession(); // verifySession ya maneja bypass

  try {
    return await dataFetcher(userId);
  } catch (error) {
    console.error('DAL: Secure data fetch error:', error);
    throw new Error('Data access denied');
  }
}

/**
 * Example: Get user's dashboard data
 * This shows the pattern for protected data access
 */
export async function getDashboardData() {
  // getSecureData llamará a verifySession
  return getSecureData(async (userId) => {
    // Si no hay DB, getCurrentUser ya simulará el usuario
    const user = await getCurrentUser(); // Usamos getCurrentUser para simular si la DB no está conectada

    if (!user) {
      throw new Error('User not found or simulated user failed');
    }

    return {
      user,
      // Añadir otros datos del dashboard aquí
      // widgets: await getWidgets(userId),
      // notifications: await getNotifications(userId),
    };
  });
}

/**
 * Admin-only data access example
 */
export async function getAdminData() {
  await requireRole('ADMIN'); // Verifica el rol de administrador

  // getSecureData llamará a verifySession y getCurrentUser
  return getSecureData(async (userId) => {
    // Admin-specific data access
    // Si no hay DB, las consultas a Prisma fallarán. Podrías simular datos aquí.
    if (process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true' && !prisma) {
        console.warn(`DAL: getAdminData - No DB connected or bypass active. Returning simulated admin data.`);
        return {
            totalUsers: 999, // Datos simulados
            reports: ['Simulated Report 1', 'Simulated Report 2']
        };
    }

    const stats = await prisma.user.count(); // Ejemplo: contar todos los usuarios

    return {
      totalUsers: stats,
      // Añadir otros datos del administrador
    };
  });
}

/**
 * Example: Secure data access pattern for SaaS applications
 * Customize this for your specific business logic
 */
export async function getBusinessData(resourceId: string) {
  const { userId } = await verifySession();

  return getSecureData(async () => {
    // Example: Get business-specific data
    if (process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true' && !prisma) {
        console.warn(`DAL: getBusinessData - No DB connected or bypass active. Returning simulated data.`);
        return {
            id: resourceId,
            name: 'Simulated Resource',
            data: 'Sample business data',
        };
    }

    // Return business data with proper authorization
    return await prisma.user.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        name: true,
        // Add your business-specific fields here
      },
    });
  });
}