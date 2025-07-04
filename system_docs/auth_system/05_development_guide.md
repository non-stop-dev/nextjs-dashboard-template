# Development Guide and Troubleshooting

## Quick Start Guide

### 1. Initial Setup

```bash
# Clone and navigate to project
cd sifrex-frontend

# Install dependencies
npm install

# Set up environment for development
cp .env.example .env.local

# Add development configuration
echo "DEV_DAL_BYPASS=true" >> .env.local
echo "DEV_USER_ID=dev-admin-001" >> .env.local
echo "DEV_USER_EMAIL=admin@dev.com" >> .env.local
echo "DEV_USER_ROLE=ADMIN" >> .env.local
echo "NEXTAUTH_SECRET=dev-secret-key-change-in-production" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

# Start development server
npm run dev
```

### 2. Development Login

With development bypass active, access the application at `http://localhost:3000`:

- **Email**: `admin@dev.com`
- **Password**: `devpassword123`
- **Role**: ADMIN (configurable via `DEV_USER_ROLE`)

### 3. Testing Different Roles

```bash
# Test as BASIC user
export DEV_USER_ROLE=BASIC
npm run dev

# Test as PREMIUM user  
export DEV_USER_ROLE=PREMIUM
npm run dev

# Test as SUPER_ADMIN
export DEV_USER_ROLE=SUPER_ADMIN
npm run dev
```

## Development Environment

### Environment Variables

#### Required for Development
```bash
# Development mode configuration
NODE_ENV=development
DEV_DAL_BYPASS=true                    # Enables development bypass
DEV_USER_ID=dev-admin-001             # Mock user ID
DEV_USER_EMAIL=admin@dev.com          # Mock user email
DEV_USER_ROLE=ADMIN                   # Mock user role

# NextAuth configuration
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Optional: Database for full testing
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db
```

#### Production Environment
```bash
# Production configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-server:5432/prod_db
NEXTAUTH_SECRET=your-secure-32-character-secret-here
NEXTAUTH_URL=https://yourdomain.com

# OAuth providers
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Remove all DEV_* variables for production
```

### Development Bypass System

The development bypass allows testing without a database connection:

#### How It Works
```typescript
// Strict security conditions must all be true
const isDevelopmentBypass = (
  process.env.NODE_ENV === 'development' &&     // Must be development
  process.env.DEV_DAL_BYPASS === 'true' &&      // Explicitly enabled
  process.env.DATABASE_URL?.includes('localhost') && // Local DB only
  !process.env.VERCEL_ENV &&                    // Not on Vercel
  !process.env.RAILWAY_ENVIRONMENT &&           // Not on Railway
  !process.env.HEROKU_APP_NAME                  // Not on Heroku
)
```

#### Bypass Features
- **Mock authentication** with configurable user data
- **Role simulation** for testing RBAC
- **Session emulation** without database
- **Development-only activation** with multiple safeguards

#### Security Safeguards
- **Multiple condition checks** prevent production use
- **Platform detection** blocks hosting environments
- **Automatic build validation** prevents deployment with bypass
- **Environment validation** ensures local development only

## Common Development Tasks

### 1. Adding New Protected Routes

```typescript
// pages/admin/users.tsx
export default async function AdminUsersPage() {
  // Require ADMIN role or higher
  await requireRole('ADMIN')
  
  const users = await getAllUsers()
  
  return <UserManagementComponent users={users} />
}
```

### 2. Creating Role-Protected Components

```typescript
// components/PremiumFeature.tsx
import { verifySession } from '@/lib/dal'

export async function PremiumFeature() {
  const { userRole } = await verifySession()
  const userLevel = roleHierarchy[userRole]
  
  if (userLevel < roleHierarchy.PREMIUM) {
    return <UpgradePrompt />
  }
  
  return <PremiumFeatureContent />
}
```

### 3. Adding Server Actions with Auth

```typescript
// lib/actions/admin.ts
'use server'

import { requireRole } from '@/lib/dal'

export async function updateUserRole(userId: string, newRole: Role) {
  // Require admin privileges
  await requireRole('ADMIN')
  
  // Validate role assignment
  const { userRole } = await verifySession()
  if (!validateRoleOperation(userRole, newRole)) {
    throw new Error('Invalid role assignment')
  }
  
  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })
}
```

### 4. Testing Authentication Flows

```typescript
// __tests__/auth.test.ts
import { signup, checkEmailAvailability } from '@/lib/actions/auth'

describe('Authentication', () => {
  beforeEach(() => {
    // Enable development bypass for testing
    process.env.DEV_DAL_BYPASS = 'true'
    process.env.NODE_ENV = 'development'
  })
  
  it('should create user with BASIC role', async () => {
    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('password', 'SecurePass123!')
    
    const result = await signup({}, formData)
    expect(result.message).toContain('successfully')
  })
})
```

## Troubleshooting Guide

### 1. Authentication Issues

#### Problem: "Session not found" errors
```bash
# Check if development bypass is enabled
echo $DEV_DAL_BYPASS

# Verify environment configuration
cat .env.local | grep DEV_

# Restart development server
npm run dev
```

**Solution:**
- Ensure `DEV_DAL_BYPASS=true` in `.env.local`
- Verify `NODE_ENV=development`
- Check that `DATABASE_URL` contains "localhost"

#### Problem: "Unauthorized" redirects in development
```typescript
// Check DAL verification
const result = await verifySession()
console.log('Session result:', result)
```

**Solution:**
- Verify development bypass conditions are met
- Check console for DAL debug messages
- Ensure mock user data is configured

### 2. Role-Based Access Issues

#### Problem: Wrong role permissions
```bash
# Check current role configuration
echo $DEV_USER_ROLE

# Test different roles
export DEV_USER_ROLE=SUPER_ADMIN
npm run dev
```

**Solution:**
- Verify role hierarchy implementation
- Check `requireRole()` function calls
- Test with different role levels

#### Problem: Role hierarchy not working
```typescript
// Debug role checking
const { userRole } = await verifySession()
console.log('Current role:', userRole)
console.log('Role level:', roleHierarchy[userRole])
```

**Solution:**
- Verify `roleHierarchy` object is correct
- Check for typos in role names
- Ensure role comparison logic is correct

### 3. Database Connection Issues

#### Problem: Prisma client errors
```bash
# Regenerate Prisma client
npx prisma generate

# Check database connection
npx prisma db push

# Verify schema
npx prisma studio
```

**Solution:**
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Run database migrations
- Check Prisma client generation

#### Problem: "Cannot find module @prisma/client"
```bash
# Reinstall Prisma
npm install prisma @prisma/client

# Generate client
npx prisma generate
```

**Solution:**
- Reinstall Prisma packages
- Regenerate Prisma client
- Restart development server

### 4. Development Bypass Issues

#### Problem: Bypass not working in development
```typescript
// Debug bypass conditions
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DEV_DAL_BYPASS:', process.env.DEV_DAL_BYPASS)
console.log('DATABASE_URL contains localhost:', 
  process.env.DATABASE_URL?.includes('localhost'))
console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
```

**Solution:**
- Check all bypass conditions are met
- Verify environment variables are set
- Ensure no hosting platform variables are set

#### Problem: Bypass active in production build
```bash
# Check production security
npm run security-check

# Build with security validation
npm run build
```

**Solution:**
- Remove all `DEV_*` variables from production
- Set `NODE_ENV=production`
- Run security check before deployment

### 5. NextAuth Configuration Issues

#### Problem: "Invalid configuration" errors
```bash
# Check NextAuth configuration
cat auth.config.ts

# Verify environment variables
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
```

**Solution:**
- Verify `auth.config.ts` syntax
- Check provider configurations
- Ensure callback URLs are correct

#### Problem: OAuth provider errors
```bash
# Test Google OAuth setup
echo $AUTH_GOOGLE_ID
echo $AUTH_GOOGLE_SECRET
```

**Solution:**
- Verify OAuth credentials in Google Console
- Check redirect URIs configuration
- Test OAuth flow with correct credentials

## Testing and Validation

### 1. Authentication Testing

```bash
# Run authentication tests
npm test auth

# Test with different roles
DEV_USER_ROLE=BASIC npm test
DEV_USER_ROLE=ADMIN npm test
```

### 2. Security Validation

```bash
# Run security check
npm run security-check

# Test production build
npm run build

# Check for development bypasses
grep -r "DEV_DAL_BYPASS" src/
```

### 3. Role Testing

```typescript
// Test role hierarchy
async function testRoleAccess() {
  const testCases = [
    { role: 'BASIC', canAccess: ['BASIC'] },
    { role: 'PREMIUM', canAccess: ['BASIC', 'PLUS', 'PREMIUM'] },
    { role: 'ADMIN', canAccess: ['BASIC', 'PLUS', 'PREMIUM', 'PREMIUM_PLUS', 'ADMIN'] }
  ]
  
  for (const test of testCases) {
    process.env.DEV_USER_ROLE = test.role
    for (const accessRole of test.canAccess) {
      await expect(requireRole(accessRole)).resolves.toBe(true)
    }
  }
}
```

## Development Best Practices

### 1. Environment Management

```bash
# Use separate environment files
.env.local          # Development overrides
.env.development    # Development defaults
.env.production     # Production configuration
.env.test          # Testing configuration
```

### 2. Code Organization

```
src/lib/
├── dal.ts              # Data Access Layer (security boundary)
├── actions/
│   ├── auth.ts         # Authentication server actions
│   └── admin.ts        # Admin server actions
├── auth/
│   ├── definitions.ts  # Type definitions
│   ├── prisma.ts      # Database client
│   └── rate-limiting.ts # Rate limiting logic
└── utils.ts           # Utility functions
```

### 3. Security Guidelines

```typescript
// ✅ DO: Always use DAL functions
const data = await getSecureData(async (userId) => {
  return await getUserData(userId)
})

// ❌ DON'T: Direct database access
const data = await prisma.user.findMany()

// ✅ DO: Validate roles server-side
await requireRole('ADMIN')

// ❌ DON'T: Client-side role checking only
if (session.user.role === 'ADMIN') {
  // Client-side only check is insecure
}
```

### 4. Error Handling

```typescript
// ✅ DO: Generic error messages for users
try {
  await riskyOperation()
} catch (error) {
  console.error('Internal error:', error) // Log details internally
  return { error: 'An unexpected error occurred.' } // Generic user message
}

// ❌ DON'T: Expose internal errors
catch (error) {
  return { error: error.message } // Leaks implementation details
}
```

## Performance Optimization

### 1. Session Caching

```typescript
// Use React cache for session verification
export const verifySession = cache(async () => {
  // Session verification logic
})

// Cache is automatically invalidated between requests
```

### 2. Database Optimization

```typescript
// Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true, role: true }
  // Don't select: password, internal fields
})

// Use proper indexing for role-based queries
```

### 3. Role Checking Optimization

```typescript
// Cache role hierarchy for better performance
const roleHierarchy = {
  'BASIC': 0,
  'PLUS': 1,
  'PREMIUM': 2,
  'PREMIUM_PLUS': 3,
  'ADMIN': 4,
  'SUPER_ADMIN': 5,
} as const

// Use numeric comparison for efficiency
const userLevel = roleHierarchy[userRole]
const requiredLevel = roleHierarchy[requiredRole]
return userLevel >= requiredLevel
```

## Production Deployment Checklist

### Pre-Deployment Security Check

- [ ] **Environment Variables**
  - [ ] Remove all `DEV_*` variables
  - [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
  - [ ] Configure production `DATABASE_URL`
  - [ ] Set `NODE_ENV=production`

- [ ] **Security Validation**
  - [ ] Run `npm run security-check`
  - [ ] Test build process: `npm run build`
  - [ ] Verify no development bypasses active
  - [ ] Check security headers in middleware

- [ ] **Database Setup**
  - [ ] PostgreSQL database configured
  - [ ] Run database migrations: `npx prisma db push`
  - [ ] Verify auth tables created
  - [ ] Test database connectivity

- [ ] **Authentication Testing**
  - [ ] Test user registration flow
  - [ ] Test login/logout functionality
  - [ ] Verify role-based access control
  - [ ] Test OAuth providers (if configured)

- [ ] **Performance Validation**
  - [ ] Test session management under load
  - [ ] Verify caching is working correctly
  - [ ] Check database connection pooling
  - [ ] Monitor authentication response times

This development guide provides comprehensive guidance for working with the authentication system, troubleshooting common issues, and ensuring production readiness.