# API Reference

## Data Access Layer (DAL) Functions

The DAL serves as the primary security boundary. All data access must go through these functions.

### Core Authentication Functions

#### `verifySession()`

Verifies user session and returns authentication status.

```typescript
export const verifySession = cache(async (): Promise<{
  isAuth: boolean
  userId: string
  userEmail: string
  userRole: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
}> => {
  // Implementation with development bypass support
})
```

**Returns:**
- `isAuth`: Boolean indicating if user is authenticated
- `userId`: User ID from session
- `userEmail`: User email from session  
- `userRole`: User role for authorization

**Throws:**
- Redirects to `/es/signin` if not authenticated

**Usage:**
```typescript
const { userId, userRole } = await verifySession()
```

---

#### `getCurrentUser()`

Retrieves current user data with full authorization check.

```typescript
export async function getCurrentUser(): Promise<User | null>
```

**Returns:**
- `User` object with id, name, email, role
- `null` if user not found or error occurred

**Usage:**
```typescript
const user = await getCurrentUser()
if (!user) {
  // Handle user not found
}
```

---

#### `requireRole(requiredRole)`

Checks if current user has required role or higher.

```typescript
export async function requireRole(
  requiredRole: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
): Promise<boolean>
```

**Parameters:**
- `requiredRole`: Minimum role level required

**Returns:**
- `true` if user has sufficient role

**Throws:**
- Redirects to `/unauthorized` if insufficient privileges

**Usage:**
```typescript
await requireRole('ADMIN') // Only admins and super admins can proceed
```

---

#### `hasRole(role)`

Helper function to check if user has specific role (non-throwing).

```typescript
export async function hasRole(
  role: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
): Promise<boolean>
```

**Parameters:**
- `role`: Role to check

**Returns:**
- `true` if user has role or higher, `false` otherwise

**Usage:**
```typescript
const isAdmin = await hasRole('ADMIN')
if (isAdmin) {
  // Show admin features
}
```

---

#### `hasMinimumRole(minimumRole)`

Checks if user meets minimum role requirement.

```typescript
export async function hasMinimumRole(
  minimumRole: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
): Promise<boolean>
```

**Parameters:**
- `minimumRole`: Minimum role level required

**Returns:**
- `true` if user meets minimum requirement

**Usage:**
```typescript
const hasPremium = await hasMinimumRole('PREMIUM')
```

### Secure Data Access Functions

#### `getSecureData(dataFetcher)`

Template for secure data fetching with automatic authentication.

```typescript
export async function getSecureData<T>(
  dataFetcher: (userId: string) => Promise<T>
): Promise<T>
```

**Parameters:**
- `dataFetcher`: Function that takes userId and returns data

**Returns:**
- Result from dataFetcher function

**Throws:**
- `Error('Data access denied')` on failure

**Usage:**
```typescript
const userData = await getSecureData(async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  })
})
```

---

#### `getDashboardData()`

Gets dashboard data for current user.

```typescript
export async function getDashboardData(): Promise<{
  user: User
  // Additional dashboard data
}>
```

**Returns:**
- Object containing user data and dashboard information

**Usage:**
```typescript
const dashboardData = await getDashboardData()
```

---

#### `getAdminData()`

Gets admin-specific data (requires ADMIN role).

```typescript
export async function getAdminData(): Promise<{
  totalUsers: number
  reports?: string[]
}>
```

**Returns:**
- Admin statistics and reports

**Throws:**
- Redirects to `/unauthorized` if not admin

**Usage:**
```typescript
await requireRole('ADMIN') // Explicit check
const adminData = await getAdminData()
```

---

#### `getUserTenantData(tenantId)`

Gets tenant-specific data with access verification.

```typescript
export async function getUserTenantData(tenantId: string): Promise<{
  userId: string
  tenantId: string
  // Additional tenant data
}>
```

**Parameters:**
- `tenantId`: ID of tenant to access

**Returns:**
- Tenant data if user has access

**Throws:**
- Redirects to `/unauthorized` if no tenant access

**Usage:**
```typescript
const tenantData = await getUserTenantData('tenant-123')
```

## Server Actions

### Authentication Actions (`src/lib/actions/auth.ts`)

#### `signup(prevState, formData)`

Handles user registration with validation and security.

```typescript
export async function signup(
  prevState: FormState,
  formData: FormData,
): Promise<FormState>
```

**Parameters:**
- `prevState`: Previous form state for progressive enhancement
- `formData`: Form data containing name, email, password

**Returns:**
```typescript
type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined
```

**Security Features:**
- Server-side input validation with Zod
- bcrypt password hashing (12 rounds)
- Email uniqueness check
- Default BASIC role assignment

**Usage:**
```typescript
// In form action
const result = await signup({}, formData)
if (result?.errors) {
  // Handle validation errors
}
if (result?.message) {
  // Handle success or error message
}
```

---

#### `checkEmailAvailability(email)`

Checks if email is available for registration.

```typescript
export async function checkEmailAvailability(email: string): Promise<boolean>
```

**Parameters:**
- `email`: Email address to check

**Returns:**
- `true` if email is available, `false` if taken or invalid

**Usage:**
```typescript
const isAvailable = await checkEmailAvailability('user@example.com')
```

---

#### `requestPasswordReset(email)`

Initiates password reset process.

```typescript
export async function requestPasswordReset(email: string): Promise<FormState>
```

**Parameters:**
- `email`: Email address for password reset

**Returns:**
- FormState with success message (always returns success for security)

**Security Notes:**
- Always returns success message to prevent email enumeration
- Actual implementation requires email service integration

**Usage:**
```typescript
const result = await requestPasswordReset('user@example.com')
```

## Rate Limiting Functions (`src/lib/rate-limiting.ts`)

#### `checkRateLimit(identifier)`

Checks and updates rate limit for identifier.

```typescript
export function checkRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  resetTime: number
}
```

**Parameters:**
- `identifier`: Usually email address for rate limiting

**Returns:**
- `allowed`: Whether request is allowed
- `remaining`: Remaining attempts in window
- `resetTime`: Timestamp when limit resets

**Configuration:**
- 5 attempts per 15-minute window
- Email-based tracking

**Usage:**
```typescript
const rateLimit = checkRateLimit('user@example.com')
if (!rateLimit.allowed) {
  return { error: 'Too many attempts. Please try again later.' }
}
```

---

#### `resetRateLimit(identifier)`

Resets rate limit for identifier (testing/admin use).

```typescript
export function resetRateLimit(identifier: string): void
```

**Parameters:**
- `identifier`: Identifier to reset

**Usage:**
```typescript
resetRateLimit('user@example.com') // For testing or admin override
```

## NextAuth Functions

### Core NextAuth Exports (`auth.ts`)

#### `auth()`

Gets current NextAuth session.

```typescript
export const auth: () => Promise<Session | null>
```

**Returns:**
- NextAuth session object or null

**Usage:**
```typescript
const session = await auth()
if (session?.user) {
  // User is authenticated
}
```

---

#### `signIn(provider, options)`

Initiates sign-in process.

```typescript
export const signIn: (provider?: string, options?: SignInOptions) => Promise<void>
```

**Parameters:**
- `provider`: 'google' | 'credentials' | undefined
- `options`: Sign-in options including redirect URL

**Usage:**
```typescript
// Google OAuth
await signIn('google')

// Credentials
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirectTo: '/dashboard'
})
```

---

#### `signOut(options)`

Signs out current user.

```typescript
export const signOut: (options?: SignOutOptions) => Promise<void>
```

**Parameters:**
- `options`: Sign-out options including redirect URL

**Usage:**
```typescript
await signOut({ redirectTo: '/signin' })
```

---

#### `isDatabaseConnected()`

Validates database connection.

```typescript
export const isDatabaseConnected: () => Promise<boolean>
```

**Returns:**
- `true` if database is connected, `false` otherwise

**Usage:**
```typescript
const connected = await isDatabaseConnected()
if (!connected) {
  console.error('Database connection failed')
}
```

## Role Hierarchy Constants

### Role Levels

```typescript
const roleHierarchy = {
  'BASIC': 0,        // Default subscription tier
  'PLUS': 1,         // First paid tier
  'PREMIUM': 2,      // Business tier
  'PREMIUM_PLUS': 3, // Enterprise tier
  'ADMIN': 4,        // System administration
  'SUPER_ADMIN': 5,  // Full system access
} as const
```

### Role Validation Functions

#### `isValidRoleTransition(fromRole, toRole)`

Validates if role transition is allowed.

```typescript
function isValidRoleTransition(fromRole: string, toRole: string): boolean
```

#### `validateRoleOperation(operatorRole, targetRole)`

Validates if operator can assign target role.

```typescript
export async function validateRoleOperation(
  operatorRole: string, 
  targetRole: string
): Promise<boolean>
```

## Type Definitions

### Core Types

```typescript
// User type
export type User = {
  id: string
  name: string | null
  email: string
  role: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
}

// Form state for server actions
export type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined

// Session payload
export type SessionPayload = {
  userId: string
  expiresAt: Date
}
```

### Validation Schemas

```typescript
// Signup form validation
export const SignupFormSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().trim(),
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Contain at least one special character.' })
    .trim(),
})

// Signin form validation
export const SigninFormSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(1).trim(),
})
```

## Environment Variables

### Development Environment

```bash
# Required for development bypass
NODE_ENV=development
DEV_DAL_BYPASS=true
DEV_USER_ID=dev-admin-001
DEV_USER_EMAIL=admin@dev.com
DEV_USER_ROLE=ADMIN

# NextAuth configuration
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Optional database
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db
```

### Production Environment

```bash
# Production configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-server:5432/prod_db
NEXTAUTH_SECRET=your-secure-32-character-secret-here
NEXTAUTH_URL=https://yourdomain.com

# OAuth providers
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

## Error Handling

### Common Error Patterns

```typescript
// Authentication required
if (!session) {
  redirect('/es/signin')
}

// Insufficient privileges
if (userLevel < requiredLevel) {
  redirect('/unauthorized')
}

// Generic error handling
try {
  await riskyOperation()
} catch (error) {
  console.error('Internal error:', error)
  return { message: 'An unexpected error occurred.' }
}
```

### Security Considerations

- **Never expose internal errors** to users
- **Always log errors internally** for debugging
- **Use generic error messages** for security
- **Validate all inputs** server-side
- **Check authentication** for every protected operation

## Testing Utilities

### Mock Functions

```typescript
// Mock session for testing
function mockSession(sessionData: Partial<Session>) {
  // Test implementation
}

// Mock development bypass
function enableDevBypass(userData: {
  userId: string
  userEmail: string
  userRole: string
}) {
  process.env.DEV_DAL_BYPASS = 'true'
  process.env.DEV_USER_ID = userData.userId
  process.env.DEV_USER_EMAIL = userData.userEmail
  process.env.DEV_USER_ROLE = userData.userRole
}
```

### Test Patterns

```typescript
// Test authentication
describe('Authentication', () => {
  it('should require authentication', async () => {
    await expect(protectedFunction()).rejects.toThrow()
  })
})

// Test role-based access
describe('Role Access', () => {
  it('should allow admin access', async () => {
    mockSession({ user: { role: 'ADMIN' } })
    await expect(requireRole('ADMIN')).resolves.toBe(true)
  })
})
```

This API reference provides comprehensive documentation for all authentication system functions, types, and usage patterns.