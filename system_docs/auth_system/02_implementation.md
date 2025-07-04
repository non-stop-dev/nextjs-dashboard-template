# Implementation Details

## File Structure and Code Patterns

### Core Implementation Files

```
sifrex-frontend/
├── auth.ts                              # NextAuth configuration
├── auth.config.ts                       # Providers and callbacks
├── src/
│   ├── middleware.ts                    # Route protection
│   ├── lib/
│   │   ├── dal.ts                      # Data Access Layer
│   │   ├── auth/
│   │   │   ├── definitions.ts          # Type definitions
│   │   │   ├── prisma.ts               # Database client
│   │   │   └── rate-limiting.ts        # Rate limiting logic
│   │   ├── actions/
│   │   │   └── auth.ts                 # Server actions
│   │   └── utils.ts                    # Utility functions
│   ├── components/auth/
│   │   └── session-provider.tsx        # Client session provider
│   └── app/
│       ├── [locale]/(auth)/            # Auth pages
│       └── api/[...nextauth]/route.ts  # NextAuth API route
└── prisma/
    └── schema.prisma                   # Database schema
```

## Core Implementations

### 1. NextAuth Configuration (`auth.ts`)

```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/auth/prisma'
import authConfig from './auth.config'

// Database connection validation
const isDatabaseConnected = async () => {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  ...authConfig,
})

export { isDatabaseConnected }
```

**Key Implementation Details:**
- Uses shared Prisma instance to prevent connection issues
- JWT strategy for stateless sessions
- Database connection validation function
- 24-hour session with 1-hour refresh interval

### 2. Authentication Providers (`auth.config.ts`)

```typescript
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { SigninFormSchema } from '@/lib/auth/definitions'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/auth/prisma'
import { checkRateLimit } from '@/lib/auth/rate-limiting'

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    Credentials({
      async authorize(credentials) {
        // 1. Validate input format
        const parsedCredentials = SigninFormSchema.safeParse(credentials)
        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data
        
        // 2. Rate limiting check
        const rateLimitResult = checkRateLimit(email);
        if (!rateLimitResult.allowed) return null;
        
        // 3. User lookup
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, password: true, role: true }
        })

        if (!user || !user.password) return null

        // 4. Password verification
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) return null

        // 5. Return safe user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  
  pages: {
    signIn: '/signin',
  },
  
  callbacks: {
    // Authorization callback for middleware
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.includes('/dashboard')
      const locale = nextUrl.pathname.split('/')[1] || 'es'
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isLoggedIn) {
        return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl))
      }
      
      return true
    },
    
    // JWT callback to include role
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    
    // Session callback to expose role to client
    session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
```

**Implementation Patterns:**
- Input validation with Zod schemas
- Rate limiting integration
- Secure password comparison with bcrypt
- Role injection into JWT and session
- Locale-aware redirects

### 3. Data Access Layer (`src/lib/dal.ts`)

```typescript
'use server'

import { auth } from '@/../auth'
import { prisma } from '@/lib/auth/prisma'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/auth/definitions'
import { Role } from '@prisma/client'

// Cached session verification - PRIMARY SECURITY BOUNDARY
export const verifySession = cache(async () => {
  // Development bypass with strict conditions
  const isDevelopmentBypass = (
    process.env.NODE_ENV === 'development' && 
    process.env.DEV_DAL_BYPASS === 'true' &&
    process.env.DATABASE_URL?.includes('localhost') &&
    !process.env.VERCEL_ENV &&
    !process.env.RAILWAY_ENVIRONMENT &&
    !process.env.HEROKU_APP_NAME
  );
  
  if (isDevelopmentBypass) {
    const devUserId = process.env.DEV_USER_ID || 'dev-dal-user-id-default';
    const devUserEmail = process.env.DEV_USER_EMAIL || 'dev-dal-default@example.com';
    const devUserRole = (process.env.DEV_USER_ROLE as any) || 'ADMIN';

    return {
      isAuth: true,
      userId: devUserId,
      userEmail: devUserEmail,
      userRole: devUserRole,
    };
  }

  // Production session validation
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/es/signin');
  }

  return {
    isAuth: true,
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role as any,
  };
});

// Get current user with authorization
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await verifySession();

  // Development bypass fallback
  if (process.env.NODE_ENV === 'development' && process.env.DEV_DAL_BYPASS === 'true') {
    return {
      id: userId,
      name: 'Dev Bypass User',
      email: process.env.DEV_USER_EMAIL || 'dev@example.com',
      role: process.env.DEV_USER_ROLE as any || 'ADMIN',
    } as User;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    return user as User | null;
  } catch (error) {
    console.error('DAL: getCurrentUser error:', error);
    return null;
  }
}

// Role-based access control
export async function requireRole(requiredRole: keyof typeof Role) {
  const { userRole } = await verifySession();

  const roleHierarchy = {
    'BASIC': 0,
    'PLUS': 1,
    'PREMIUM': 2,
    'PREMIUM_PLUS': 3,
    'ADMIN': 4,
    'SUPER_ADMIN': 5,
  };

  if (!Object.keys(roleHierarchy).includes(userRole)) {
    redirect('/unauthorized');
  }

  if (roleHierarchy[userRole as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
    redirect('/unauthorized');
  }

  return true;
}

// Secure data fetching template
export async function getSecureData<T>(
  dataFetcher: (userId: string) => Promise<T>
): Promise<T> {
  const { userId } = await verifySession();

  try {
    return await dataFetcher(userId);
  } catch (error) {
    console.error('DAL: Secure data fetch error:', error);
    throw new Error('Data access denied');
  }
}

// Example secure data functions
export async function getDashboardData() {
  return getSecureData(async (userId) => {
    const user = await getCurrentUser();
    return {
      user,
      // Add other dashboard data here
    };
  });
}

export async function getAdminData() {
  await requireRole('ADMIN');
  
  return getSecureData(async (userId) => {
    // Development bypass simulation
    if (process.env.DEV_DAL_BYPASS === 'true') {
      return {
        totalUsers: 999,
        reports: ['Simulated Report 1', 'Simulated Report 2']
      };
    }

    const stats = await prisma.user.count();
    return { totalUsers: stats };
  });
}
```

**DAL Implementation Patterns:**
- React cache for session verification performance
- Strict development bypass conditions
- Role hierarchy enforcement
- Secure data fetching templates
- Error handling without information leakage

### 4. Server Actions (`src/lib/actions/auth.ts`)

```typescript
'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignupFormSchema, type FormState } from '@/lib/auth/definitions'
import { prisma } from '@/lib/auth/prisma'
import { Prisma, Role } from '@prisma/client'

export async function signup(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // 1. Input validation
  const validationResult = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validationResult.data

  try {
    // 2. Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return {
        message: 'A user with this email already exists.',
      }
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // 4. Create user with BASIC role
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.BASIC, // Default role
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return {
      message: 'Account created successfully! Please sign in.',
    }

  } catch (error) {
    console.error('Signup error:', error)

    // Handle Prisma errors securely
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          message: 'A user with this email already exists.',
        }
      }
    }

    return {
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Email availability check
export async function checkEmailAvailability(email: string): Promise<boolean> {
  const emailSchema = z.string().email()
  const validationResult = emailSchema.safeParse(email)

  if (!validationResult.success) return false

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: validationResult.data },
      select: { id: true },
    })

    return !existingUser
  } catch (error) {
    console.error('Email availability check error:', error)
    return false
  }
}
```

**Server Action Patterns:**
- Server-side input validation with Zod
- bcrypt password hashing (12 rounds)
- Secure error handling
- Database error code handling
- Default role assignment

### 5. Rate Limiting (`src/lib/auth/rate-limiting.ts`)

```typescript
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (Redis recommended for production)
const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max attempts per window

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = `auth:${identifier}`;
  
  // Clean expired entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }
  
  // Initialize if not exists
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }
  
  // Increment counter
  store[key].count++;
  
  const allowed = store[key].count <= MAX_ATTEMPTS;
  const remaining = Math.max(0, MAX_ATTEMPTS - store[key].count);
  
  return {
    allowed,
    remaining,
    resetTime: store[key].resetTime,
  };
}

export function resetRateLimit(identifier: string): void {
  const key = `auth:${identifier}`;
  delete store[key];
}
```

**Rate Limiting Features:**
- 5 attempts per 15-minute window
- Automatic cleanup of expired entries
- Email-based rate limiting
- Reset functionality for testing

### 6. Type Definitions (`src/lib/auth/definitions.ts`)

```typescript
import { z } from 'zod'

// Form validation schemas
export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }).trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Contain at least one special character.' })
    .trim(),
})

export const SigninFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
})

// Type definitions
export type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined

export type User = {
  id: string
  name: string | null
  email: string
  role: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
}

// NextAuth type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: string
  }
}
```

## Development Patterns

### 1. Development Bypass System

The development bypass allows testing without database setup:

```typescript
// Strict conditions for security
const isDevelopmentBypass = (
  process.env.NODE_ENV === 'development' && 
  process.env.DEV_DAL_BYPASS === 'true' &&
  process.env.DATABASE_URL?.includes('localhost') &&
  !process.env.VERCEL_ENV &&
  !process.env.RAILWAY_ENVIRONMENT &&
  !process.env.HEROKU_APP_NAME
);
```

**Environment Variables for Development:**
```bash
DEV_DAL_BYPASS=true
DEV_USER_ID=dev-admin-001
DEV_USER_EMAIL=admin@dev.com
DEV_USER_ROLE=ADMIN
```

### 2. Error Handling Patterns

```typescript
// Never expose sensitive information
try {
  // Database operation
} catch (error) {
  console.error('Internal error:', error) // Log internally
  return { message: 'An unexpected error occurred.' } // Generic user message
}
```

### 3. Security Validation Patterns

```typescript
// Always validate input server-side
const validationResult = schema.safeParse(input)
if (!validationResult.success) {
  return { errors: validationResult.error.flatten().fieldErrors }
}

// Check authentication for every protected operation
const { userId } = await verifySession()

// Verify authorization for role-restricted operations
await requireRole('ADMIN')
```

## Testing Patterns

### 1. Authentication Testing

```typescript
// Test with development bypass
process.env.DEV_DAL_BYPASS = 'true'
process.env.DEV_USER_ROLE = 'ADMIN'

// Test role hierarchy
await expect(requireRole('BASIC')).resolves.toBe(true)
await expect(requireRole('SUPER_ADMIN')).rejects.toThrow()
```

### 2. Rate Limiting Testing

```typescript
// Test rate limiting
for (let i = 0; i < 6; i++) {
  const result = checkRateLimit('test@example.com')
  if (i < 5) expect(result.allowed).toBe(true)
  else expect(result.allowed).toBe(false)
}
```

## Performance Optimizations

### 1. Session Caching

```typescript
// React cache for session verification
export const verifySession = cache(async () => {
  // Session validation logic
})
```

### 2. Database Connection Management

```typescript
// Shared Prisma instance (src/lib/auth/prisma.ts)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Common Implementation Pitfalls

### 1. Multiple Prisma Instances
❌ **Don't:** Create separate PrismaClient instances in each file
✅ **Do:** Use shared instance from `@/lib/auth/prisma`

### 2. Client-Side Session Access
❌ **Don't:** Access session data in client components without SessionProvider
✅ **Do:** Use SessionProvider and `useSession()` hook

### 3. Bypassing DAL
❌ **Don't:** Access Prisma directly in components
✅ **Do:** Always go through DAL functions for data access

### 4. Hardcoded Roles
❌ **Don't:** Check roles with string comparisons
✅ **Do:** Use role hierarchy system and `requireRole()` function