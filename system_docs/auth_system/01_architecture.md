# Authentication System Architecture

## Overview

The Sifrex authentication system implements a multi-layer security architecture using NextAuth.js v5 with Prisma ORM, following enterprise security best practices with defense-in-depth principles.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  • React Components                                        │
│  • SessionProvider (Client)                                │
│  • Auth Forms (Login/Register)                             │
│  • Protected Routes                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  • src/middleware.ts                                       │
│  • Route Protection (Optimistic UX)                       │
│  • Internationalization (i18n)                            │
│  • Security Headers                                        │
│  • CSRF Protection (CVE-2025-29927)                       │
│  • Development Bypass Logic                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXTAUTH LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  • auth.ts - NextAuth Configuration                       │
│  • auth.config.ts - Providers & Callbacks                 │
│  • JWT Strategy                                            │
│  • Session Management                                      │
│  • OAuth Providers (Google)                               │
│  • Credentials Provider                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (DAL)                       │
├─────────────────────────────────────────────────────────────┤
│  • src/lib/dal.ts - PRIMARY SECURITY BOUNDARY             │
│  • Session Verification                                    │
│  • Role-Based Access Control                              │
│  • Multi-tenant Data Isolation                            │
│  • Development Bypass System                              │
│  • Secure Data Fetching Patterns                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL Database                                     │
│  • Prisma ORM                                             │
│  • NextAuth Tables (users, accounts, sessions)            │
│  • Role-Based Schema                                       │
│  • Connection Pooling                                      │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. NextAuth.js Configuration (`auth.ts`)

```typescript
// Primary NextAuth setup with Prisma adapter
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour
  },
  ...authConfig,
})
```

**Key Features:**
- Prisma adapter for database integration
- JWT session strategy for scalability
- 24-hour session with 1-hour refresh
- Database connection validation

### 2. Authentication Providers (`auth.config.ts`)

```typescript
providers: [
  // Google OAuth Provider
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
  
  // Email/Password Credentials
  Credentials({
    async authorize(credentials) {
      // Rate limiting check
      // Password validation
      // User lookup and verification
    }
  })
]
```

**Features:**
- Multi-provider support (Google OAuth + Credentials)
- Rate limiting (5 attempts per 15 minutes)
- bcrypt password hashing (12 rounds)
- Input validation with Zod schemas

### 3. Data Access Layer (`src/lib/dal.ts`)

**Primary Security Boundary** - All data access must go through DAL functions.

```typescript
// Session verification with caching
export const verifySession = cache(async () => {
  // Development bypass logic (strict conditions)
  // Production session validation
  // Role-based access control
})

// Secure data fetching template
export async function getSecureData<T>(
  dataFetcher: (userId: string) => Promise<T>
): Promise<T>
```

**Security Features:**
- Cached session verification
- Development bypass with strict conditions
- Role hierarchy enforcement
- Multi-tenant data isolation
- Error handling without information leakage

### 4. Middleware Protection (`src/middleware.ts`)

```typescript
export default auth((request) => {
  // Security header sanitization
  // Development bypass detection
  // i18n route handling
  // Optimistic authentication redirects
  // Security headers injection
})
```

**Protection Layers:**
- CVE-2025-29927 mitigation (header sanitization)
- Security headers (XSS, CSRF, Clickjacking)
- Rate limiting integration
- Internationalization support

## Data Flow

### 1. Authentication Flow

```
User Login → Middleware Check → NextAuth Validation → DAL Verification → Database Query
     ↓
Protected Resource Access ← Role Check ← Session Cache ← JWT Validation
```

### 2. Registration Flow

```
User Signup → Form Validation → Server Action → Password Hashing → Database Insert
     ↓
Role Assignment (BASIC) → Session Creation → Redirect to Dashboard
```

### 3. Route Protection Flow

```
Route Request → Middleware → Session Check → Role Verification → Component Render
     ↓
Unauthorized → Redirect to Login → Callback URL Preservation
```

## Database Schema

### Core Authentication Tables

```sql
-- Users table with 6-tier role system
users (
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?   -- bcrypt hashed
  role          Role      @default(BASIC)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
)

-- NextAuth required tables
accounts, sessions, verificationtokens

-- Role enum
enum Role {
  BASIC, PLUS, PREMIUM, PREMIUM_PLUS, ADMIN, SUPER_ADMIN
}
```

## Security Architecture

### Defense in Depth Layers

1. **Client-Side Protection**
   - Form validation
   - Protected routes
   - Session state management

2. **Middleware Layer**
   - Request sanitization
   - Route authentication
   - Security headers

3. **Application Layer** 
   - NextAuth.js validation
   - Rate limiting
   - Input validation

4. **Data Access Layer**
   - Session verification
   - Role-based access
   - Secure data patterns

5. **Database Layer**
   - Encrypted passwords
   - Proper schemas
   - Connection security

### Development vs Production

#### Development Mode (`DEV_DAL_BYPASS=true`)
- Simulated authentication for rapid development
- Strict conditions prevent production deployment
- Mock user data for testing
- Bypasses database requirements

#### Production Mode
- Full database integration required
- All security checks active
- Environment validation
- Performance optimizations

## Role-Based Access Control (RBAC)

### Role Hierarchy
```typescript
const roleHierarchy = {
  'BASIC': 0,        // Default for new users
  'PLUS': 1,         // Subscription tier 1
  'PREMIUM': 2,      // Subscription tier 2
  'PREMIUM_PLUS': 3, // Subscription tier 3
  'ADMIN': 4,        // System administration
  'SUPER_ADMIN': 5,  // Full system access
}
```

### Access Patterns

```typescript
// Route-level protection
await requireRole('ADMIN')

// Component-level access
const { userRole } = await verifySession()
if (roleHierarchy[userRole] >= roleHierarchy['PREMIUM']) {
  // Show premium features
}

// Data-level filtering
export async function getTenantData(tenantId: string) {
  const { userId } = await verifySession()
  // Verify user belongs to tenant
}
```

## Performance Considerations

### Caching Strategy
- Session verification cached with React cache
- Database connection pooling
- JWT stateless sessions

### Scalability Features
- JWT sessions (no database queries per request)
- Connection pooling with Prisma
- Efficient role checking
- Optimized middleware execution

## Integration Points

### Email Service (Planned)
- Password reset flows
- Account verification
- Security notifications
- Role change notifications

### 2FA System (Planned)
- TOTP integration
- Backup codes
- SMS fallback
- Recovery options

### Audit Logging (Planned)
- Authentication events
- Role changes
- Security incidents
- Access patterns