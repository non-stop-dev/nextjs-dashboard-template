# Role-Based Access Control (RBAC) System

## Overview

The Sifrex RBAC system implements a hierarchical 6-tier role structure designed for SaaS applications with subscription-based access control and administrative functions.

## Role Hierarchy

```
SUPER_ADMIN (Level 5) ┐
                      │
ADMIN (Level 4)       ├─ Administrative Roles
                      │
PREMIUM_PLUS (Level 3)┘
                      ┐
PREMIUM (Level 2)     ├─ Subscription Roles
                      │
PLUS (Level 1)        │
                      │
BASIC (Level 0)       ┘
```

## Role Definitions

### Subscription Roles

#### BASIC (Level 0)
- **Default role** for new user registrations
- **Basic access** to core application features
- **Limited functionality** suitable for free tier
- **No administrative privileges**

**Typical Permissions:**
- View personal dashboard
- Basic profile management
- Limited data access
- Standard user features

#### PLUS (Level 1) 
- **First paid tier** with enhanced features
- **Extended functionality** beyond basic tier
- **Higher usage limits** for API calls, storage, etc.
- **Priority support** access

**Additional Permissions:**
- Enhanced dashboard features
- Extended data exports
- Priority processing
- Advanced filtering options

#### PREMIUM (Level 2)
- **Mid-tier subscription** with comprehensive features
- **Business-oriented functionality**
- **Team collaboration** features
- **Advanced integrations**

**Additional Permissions:**
- Team management features
- Advanced analytics
- Custom integrations
- Bulk operations

#### PREMIUM_PLUS (Level 3)
- **Highest subscription tier** with all features
- **Enterprise-level** functionality
- **Custom configurations**
- **Dedicated support**

**Additional Permissions:**
- All premium features
- Custom workflows
- Enterprise integrations
- White-label options

### Administrative Roles

#### ADMIN (Level 4)
- **System administration** capabilities
- **User management** functions
- **Application configuration**
- **Support functions**

**Administrative Permissions:**
- Manage all users
- View system analytics
- Configure application settings
- Access support tools
- Moderate content
- Manage subscriptions

#### SUPER_ADMIN (Level 5)
- **Full system access** and control
- **Critical system operations**
- **Security management**
- **System configuration**

**Full Permissions:**
- All ADMIN permissions
- System-level configuration
- Security settings management
- Database access (through application)
- Emergency operations
- Role assignment/modification

## Implementation

### 1. Database Schema (`prisma/schema.prisma`)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  password      String?
  role          Role      @default(BASIC)  // Default to BASIC
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  accounts Account[]
  sessions Session[]

  @@map("users")
}

enum Role {
  BASIC          // Level 0 - Default
  PLUS           // Level 1 - Subscription tier 1
  PREMIUM        // Level 2 - Subscription tier 2  
  PREMIUM_PLUS   // Level 3 - Subscription tier 3
  ADMIN          // Level 4 - System administration
  SUPER_ADMIN    // Level 5 - Full system access
}
```

### 2. Role Hierarchy Implementation (`src/lib/dal.ts`)

```typescript
// Role hierarchy with numeric levels for comparison
const roleHierarchy = {
  'BASIC': 0,
  'PLUS': 1,
  'PREMIUM': 2,
  'PREMIUM_PLUS': 3,
  'ADMIN': 4,
  'SUPER_ADMIN': 5,
}

// Type-safe role checking
export async function requireRole(
  requiredRole: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
) {
  const { userRole } = await verifySession()

  // Validate role exists
  if (!Object.keys(roleHierarchy).includes(userRole)) {
    console.warn(`Unknown user role: ${userRole}`)
    redirect('/unauthorized')
  }

  // Check hierarchy level
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  const requiredLevel = roleHierarchy[requiredRole]
  
  if (userLevel < requiredLevel) {
    console.warn(`Insufficient privileges: ${userRole} < ${requiredRole}`)
    redirect('/unauthorized')
  }

  return true
}

// Helper function for role checking
export async function hasRole(role: keyof typeof roleHierarchy): Promise<boolean> {
  try {
    await requireRole(role)
    return true
  } catch {
    return false
  }
}

// Check if user has at least a certain role level
export async function hasMinimumRole(minimumRole: keyof typeof roleHierarchy): Promise<boolean> {
  const { userRole } = await verifySession()
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  const minimumLevel = roleHierarchy[minimumRole]
  
  return userLevel >= minimumLevel
}
```

### 3. Role-Based Component Access

```typescript
// Component-level role checking
export async function RoleProtectedComponent({ 
  children, 
  requiredRole 
}: {
  children: React.ReactNode
  requiredRole: keyof typeof roleHierarchy
}) {
  const { userRole } = await verifySession()
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  const requiredLevel = roleHierarchy[requiredRole]
  
  if (userLevel < requiredLevel) {
    return <UnauthorizedMessage />
  }
  
  return <>{children}</>
}

// Usage example
<RoleProtectedComponent requiredRole="PREMIUM">
  <PremiumFeatureComponent />
</RoleProtectedComponent>
```

### 4. Route Protection Patterns

```typescript
// Page-level protection
export default async function AdminPage() {
  // Require ADMIN role or higher
  await requireRole('ADMIN')
  
  return <AdminDashboard />
}

// API route protection
export async function GET(request: Request) {
  await requireRole('PREMIUM')
  
  // API logic for premium users
  return NextResponse.json({ data: premiumData })
}

// Server action protection
export async function updateUserRole(userId: string, newRole: Role) {
  await requireRole('ADMIN') // Only admins can change roles
  
  // Update user role logic
}
```

## Usage Patterns

### 1. Subscription-Based Feature Access

```typescript
// Feature flagging based on subscription tier
export async function getAvailableFeatures() {
  const { userRole } = await verifySession()
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  
  const features = {
    basicDashboard: userLevel >= 0, // BASIC and above
    advancedAnalytics: userLevel >= 2, // PREMIUM and above
    teamManagement: userLevel >= 2, // PREMIUM and above
    customIntegrations: userLevel >= 3, // PREMIUM_PLUS and above
    adminPanel: userLevel >= 4, // ADMIN and above
    systemConfig: userLevel >= 5, // SUPER_ADMIN only
  }
  
  return features
}

// Usage in components
const features = await getAvailableFeatures()

return (
  <div>
    {features.basicDashboard && <BasicDashboard />}
    {features.advancedAnalytics && <AdvancedAnalytics />}
    {features.adminPanel && <AdminPanel />}
  </div>
)
```

### 2. Data Access Control

```typescript
// Role-based data filtering
export async function getUserData() {
  return getSecureData(async (userId) => {
    const { userRole } = await verifySession()
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
    
    // Basic users: own data only
    if (userLevel === 0) {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      })
    }
    
    // Premium users: extended data
    if (userLevel >= 2) {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, name: true, email: true, 
          createdAt: true, usage: true 
        }
      })
    }
    
    // Admins: all user data (with permission)
    if (userLevel >= 4) {
      return await getAllUsersForAdmin()
    }
  })
}
```

### 3. API Rate Limiting by Role

```typescript
// Role-based rate limiting
const RATE_LIMITS = {
  BASIC: { requests: 100, window: 3600 }, // 100/hour
  PLUS: { requests: 500, window: 3600 }, // 500/hour
  PREMIUM: { requests: 2000, window: 3600 }, // 2000/hour
  PREMIUM_PLUS: { requests: 10000, window: 3600 }, // 10k/hour
  ADMIN: { requests: 50000, window: 3600 }, // 50k/hour
  SUPER_ADMIN: { requests: -1, window: 0 }, // Unlimited
}

export function getRoleBasedRateLimit(role: keyof typeof roleHierarchy) {
  return RATE_LIMITS[role] || RATE_LIMITS.BASIC
}
```

## Administrative Functions

### 1. User Role Management

```typescript
// Admin function to change user roles
export async function changeUserRole(
  targetUserId: string, 
  newRole: keyof typeof roleHierarchy
) {
  // Require admin privileges
  await requireRole('ADMIN')
  
  const { userRole } = await verifySession()
  const adminLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  const newRoleLevel = roleHierarchy[newRole]
  
  // Admins cannot assign roles higher than their own
  if (newRoleLevel > adminLevel) {
    throw new Error('Cannot assign role higher than your own')
  }
  
  // SUPER_ADMIN required to assign ADMIN or SUPER_ADMIN roles
  if ((newRole === 'ADMIN' || newRole === 'SUPER_ADMIN') && userRole !== 'SUPER_ADMIN') {
    throw new Error('SUPER_ADMIN required for administrative role assignment')
  }
  
  // Update user role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  })
  
  // Log role change
  console.log(`Role changed: ${targetUserId} -> ${newRole} by ${userRole}`)
}
```

### 2. Role Statistics and Analytics

```typescript
// Admin analytics
export async function getRoleStatistics() {
  await requireRole('ADMIN')
  
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  })
  
  return roleStats.reduce((acc, stat) => {
    acc[stat.role] = stat._count.role
    return acc
  }, {} as Record<string, number>)
}

// Usage trend analysis
export async function getRoleUpgradeHistory() {
  await requireRole('ADMIN')
  
  // Query role change history (requires audit table)
  // Implementation depends on audit logging system
}
```

## Role Transition Flows

### 1. Subscription Upgrades

```typescript
// Handle subscription tier changes
export async function upgradeSubscription(
  userId: string, 
  fromRole: 'BASIC' | 'PLUS' | 'PREMIUM',
  toRole: 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS'
) {
  // Validate upgrade path
  const fromLevel = roleHierarchy[fromRole]
  const toLevel = roleHierarchy[toRole]
  
  if (toLevel <= fromLevel) {
    throw new Error('Invalid upgrade path')
  }
  
  if (toLevel > 3) {
    throw new Error('Cannot upgrade to administrative roles')
  }
  
  // Update user role
  await prisma.user.update({
    where: { id: userId },
    data: { role: toRole }
  })
  
  // Trigger upgrade benefits
  await enableRoleFeatures(userId, toRole)
  
  // Send notification email (future implementation)
  // await sendUpgradeConfirmationEmail(userId, toRole)
}
```

### 2. Administrative Appointments

```typescript
// Promote user to admin (SUPER_ADMIN only)
export async function promoteToAdmin(targetUserId: string) {
  await requireRole('SUPER_ADMIN')
  
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, email: true }
  })
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  // Only promote from subscription roles
  if (!['BASIC', 'PLUS', 'PREMIUM', 'PREMIUM_PLUS'].includes(targetUser.role)) {
    throw new Error('Cannot promote existing admin')
  }
  
  // Update to ADMIN role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: 'ADMIN' }
  })
  
  // Log administrative action
  console.log(`User promoted to ADMIN: ${targetUser.email}`)
  
  // Send admin welcome email (future implementation)
  // await sendAdminWelcomeEmail(targetUserId)
}
```

## Security Considerations

### 1. Role Validation

```typescript
// Validate role assignments
function isValidRoleTransition(fromRole: string, toRole: string): boolean {
  const fromLevel = roleHierarchy[fromRole as keyof typeof roleHierarchy]
  const toLevel = roleHierarchy[toRole as keyof typeof roleHierarchy]
  
  // Prevent invalid roles
  if (fromLevel === undefined || toLevel === undefined) {
    return false
  }
  
  // Allow upgrades and downgrades within subscription tiers
  if (fromLevel <= 3 && toLevel <= 3) {
    return true
  }
  
  // Administrative changes require special handling
  return false
}
```

### 2. Privilege Escalation Prevention

```typescript
// Prevent privilege escalation
export async function validateRoleOperation(
  operatorRole: string, 
  targetRole: string
): Promise<boolean> {
  const operatorLevel = roleHierarchy[operatorRole as keyof typeof roleHierarchy]
  const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy]
  
  // Cannot assign roles higher than your own
  if (targetLevel > operatorLevel) {
    return false
  }
  
  // Only SUPER_ADMIN can manage ADMIN roles
  if (targetRole === 'ADMIN' && operatorRole !== 'SUPER_ADMIN') {
    return false
  }
  
  // Only SUPER_ADMIN can assign SUPER_ADMIN
  if (targetRole === 'SUPER_ADMIN' && operatorRole !== 'SUPER_ADMIN') {
    return false
  }
  
  return true
}
```

## Testing Role-Based Access

### 1. Unit Testing

```typescript
// Test role hierarchy
describe('Role Hierarchy', () => {
  it('should allow higher roles to access lower role features', async () => {
    // Mock ADMIN user
    mockSession({ userRole: 'ADMIN' })
    
    // Should allow access to all lower roles
    await expect(requireRole('BASIC')).resolves.toBe(true)
    await expect(requireRole('PLUS')).resolves.toBe(true)
    await expect(requireRole('PREMIUM')).resolves.toBe(true)
    await expect(requireRole('PREMIUM_PLUS')).resolves.toBe(true)
    await expect(requireRole('ADMIN')).resolves.toBe(true)
  })
  
  it('should deny access to higher roles', async () => {
    // Mock PREMIUM user
    mockSession({ userRole: 'PREMIUM' })
    
    // Should deny access to higher roles
    await expect(requireRole('PREMIUM_PLUS')).rejects.toThrow()
    await expect(requireRole('ADMIN')).rejects.toThrow()
    await expect(requireRole('SUPER_ADMIN')).rejects.toThrow()
  })
})
```

### 2. Integration Testing

```typescript
// Test role-based API access
describe('API Role Protection', () => {
  it('should allow premium users to access premium API', async () => {
    const response = await fetch('/api/premium-feature', {
      headers: { authorization: `Bearer ${premiumUserToken}` }
    })
    
    expect(response.status).toBe(200)
  })
  
  it('should deny basic users access to premium API', async () => {
    const response = await fetch('/api/premium-feature', {
      headers: { authorization: `Bearer ${basicUserToken}` }
    })
    
    expect(response.status).toBe(403)
  })
})
```

## Future Enhancements

### 1. Dynamic Permissions System
- Granular permissions beyond role hierarchy
- Custom permission sets for enterprise clients
- Permission inheritance and overrides

### 2. Role-Based UI Customization
- Dynamic menu generation based on role
- Feature availability indicators
- Role-specific onboarding flows

### 3. Audit and Compliance
- Role change history tracking
- Permission usage analytics
- Compliance reporting for enterprise clients

### 4. Team and Organization Roles
- Multi-tenant role management
- Organization-level permissions
- Team-based access control within organizations

This RBAC system provides a solid foundation for SaaS applications with clear subscription tiers and administrative functions while maintaining security and scalability.