# NextJS Multi-Tenant SaaS Dashboard Template

## Project Overview

This is a **production-ready NextJS dashboard template** designed for multi-tenant SaaS applications. It features complete authentication, role-based access control, internationalization, and enterprise-grade security patterns. Perfect for cloning and building new SaaS products quickly.

**Current Status**: Authentication system configured with development user support. Database connection optional for initial development.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0 with Radix UI components
- **Authentication**: NextAuth.js v5.0.0-beta.29 with Prisma adapter
- **Database**: Prisma with PostgreSQL (optional for dev)
- **UI Components**: shadcn/ui with Radix primitives
- **Charts**: Recharts for analytics dashboards
- **Validation**: Zod for type-safe forms

### Key Features
- 🔐 **Multi-provider Authentication** (Google OAuth + Email/Password)
- 🏢 **Multi-tenant Architecture** ready for SaaS
- 🌍 **Internationalization** (Spanish/English)
- 🛡️ **Enterprise Security** with Data Access Layer
- 📱 **Responsive Design** with mobile-first approach
- 🎨 **Dark/Light Theme** support
- 📊 **Dashboard Components** (charts, tables, analytics)
- 🔒 **Role-based Access Control** (USER/ADMIN/SUPER_ADMIN)
- 🚀 **Development-friendly** with mock user system

## Quick Start (No Database Required)

```bash
# Clone and install
git clone [your-repo]
cd nextjs-dashboard-template/src/template-frontend
npm install

# Create development environment
echo "DEV_DAL_BYPASS=true" > .env.local
echo "NEXTAUTH_SECRET=dev-secret-key-change-in-production" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

# Start development server
npm run dev
# Open http://localhost:3000 and login with dev credentials
```

## Authentication System

### Development User (No Database)
The app includes a development user system that allows immediate access without database setup. When `DEV_DAL_BYPASS=true` is set, you can login with:

- **Email**: `admin@dev.com`
- **Password**: `devpassword123`
- **Role**: ADMIN

The dev user data is stored in memory and can be customized via environment variables.

### Production Authentication
For production, connect a PostgreSQL database and the system supports:
- Email/password authentication with bcrypt hashing
- Google OAuth integration
- Session management with NextAuth
- Role-based access control

## Development vs Production

### Development Bypass System
The project includes a secure development bypass that allows immediate access without database setup:

**How it works**: When `DEV_DAL_BYPASS=true`, the system creates a mock authenticated session in both the middleware and DAL layers.

**Security safeguards**:
- Only works when `NODE_ENV=development`
- Requires `DATABASE_URL` to contain `localhost`
- Blocked on hosting platforms (Vercel, Railway, Heroku)
- Automatic security check before build

## Environment Configuration

### Development Setup (No Database)
```bash
# .env.local
DEV_DAL_BYPASS=true
DEV_USER_ID=dev-admin-001
DEV_USER_EMAIL=admin@dev.com
DEV_USER_ROLE=ADMIN
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Production Setup (With Database)
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/your_saas_db
NEXTAUTH_SECRET=your-secure-production-secret
NEXTAUTH_URL=https://yourdomain.com
AUTH_GOOGLE_ID=your-google-oauth-id
AUTH_GOOGLE_SECRET=your-google-oauth-secret
# Remove all DEV_* variables
```

## Project Structure

### Core Authentication
```
auth.config.ts                    # NextAuth providers and callbacks
auth.ts                          # NextAuth configuration with Prisma adapter
src/middleware.ts                # Security middleware & i18n
src/lib/dal.ts                   # Data Access Layer (security boundary)
src/lib/actions/auth.ts          # Server actions for authentication
```

### Dashboard & UI
```
src/app/[locale]/(app)/          # Protected dashboard pages
├── dashboard/                   # Main dashboard
├── (settings)/                  # User settings pages
└── layout.tsx                   # Authenticated app layout

src/components/
├── ui/                          # shadcn/ui components
├── app-sidebar.tsx              # Main navigation
├── nav-*.tsx                    # Navigation components
└── chart-*.tsx                  # Analytics components
```

### Multi-tenant Support
```
src/lib/dal.ts                   # Tenant isolation functions
prisma/schema.prisma            # Multi-tenant database schema
```

## Database Schema (Production)

### Core Models
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?
  role          Role      @default(USER)
  tenantId      String?   // For multi-tenant support
  
  accounts Account[]
  sessions Session[]
  tenant   Tenant?   @relation(fields: [tenantId], references: [id])
}

model Tenant {
  id        String   @id @default(cuid())
  name      String
  domain    String   @unique
  plan      String   @default("free")
  
  users     User[]
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

## Development Commands

```bash
# Development
npm run dev                 # Start dev server with Turbopack
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # ESLint checking

# Database (when ready)
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema to database
npx prisma studio         # Open database browser
```

## Security Features

### Data Access Layer (DAL)
All data access goes through `src/lib/dal.ts` which provides:

- **Authentication Verification**: Every request validated
- **Role-Based Access Control**: Function-level permission checks
- **Multi-tenant Isolation**: Automatic tenant data filtering
- **Development Bypass**: Safe development without database
- **Security Boundaries**: No direct database access in components

### Middleware Protection
`src/middleware.ts` handles:
- CSRF protection and security headers
- Internationalization routing
- Authentication state management
- Optimistic UX redirects

## Multi-Tenant Architecture

### Tenant Isolation
```typescript
// Example: Get tenant-specific data
export async function getTenantData(tenantId: string) {
  const { userId } = await verifySession();
  
  // Verify user belongs to tenant
  const access = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenantId }
  });
  
  if (!access) redirect('/unauthorized');
  
  // Return tenant-specific data
  return await prisma.data.findMany({
    where: { tenantId: tenantId }
  });
}
```

### Usage Patterns
1. **Subdomain Routing**: `tenant1.yoursaas.com`, `tenant2.yoursaas.com`
2. **Path-based**: `yoursaas.com/tenant1`, `yoursaas.com/tenant2`  
3. **Custom Domains**: `custom-domain.com` → `tenant1`

## Common Workflows

### 1. Starting Development (First Time)
```bash
# Install and configure
npm install
cp .env.example .env.local

# Enable development mode
echo "DEV_DAL_BYPASS=true" >> .env.local

# Start and login with admin@dev.com / devpassword123
npm run dev
```

### 2. Adding New Dashboard Pages
```typescript
// src/app/[locale]/(app)/analytics/page.tsx
import { verifySession } from '@/lib/dal';

export default async function AnalyticsPage() {
  // Automatic authentication check
  const { userId, userRole } = await verifySession();
  
  return <div>Analytics Dashboard</div>;
}
```

### 3. Setting Up Production Database
```bash
# 1. Set up PostgreSQL database
# 2. Update DATABASE_URL in .env.production
# 3. Remove DEV_DAL_BYPASS
# 4. Run migrations
npx prisma db push

# 5. Create first admin user (via seeding or admin panel)
```

### 4. Adding Multi-tenant Features
```typescript
// Example: Tenant-aware data fetching
export async function getUserDashboardData() {
  return getSecureData(async (userId) => {
    const user = await getCurrentUser();
    
    return {
      user,
      tenantData: await getTenantData(user.tenantId),
      analytics: await getTenantAnalytics(user.tenantId)
    };
  });
}
```

## Internationalization

- **Supported**: Spanish (es), English (en)
- **Default**: Spanish (es)
- **URL Structure**: `/es/dashboard`, `/en/dashboard`
- **Components**: All UI text ready for translation

## Customization Guide

### 1. Branding
- Update colors in `tailwind.config.ts`
- Replace logos in `public/` directory
- Modify `src/components/app-sidebar.tsx` for navigation

### 2. Adding New Roles
```typescript
// src/lib/dal.ts
const roleHierarchy = {
  'USER': 0,
  'ADMIN': 1,
  'MANAGER': 2,        // Add custom roles
  'SUPER_ADMIN': 3,
};
```

### 3. Custom Authentication
- Add providers in `auth.config.ts`
- Modify schemas in `src/lib/definitions.ts`
- Update forms in `src/app/[locale]/auth/`

## Deployment Checklist

### Production Requirements
- [ ] PostgreSQL database configured
- [ ] `DATABASE_URL` set correctly
- [ ] `NEXTAUTH_SECRET` set to secure random string
- [ ] Remove all `DEV_*` environment variables
- [ ] Configure OAuth providers (Google, etc.)
- [ ] Set up domain and SSL
- [ ] Configure monitoring and logging

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Connect database (Vercel Postgres, Supabase, etc.)
```

## Troubleshooting

### Cannot Access Dashboard
**Symptom**: Redirected to login page in loop
**Solution**: Ensure `DEV_DAL_BYPASS=true` is set for development

### Database Connection Errors
**Symptom**: Prisma client errors
**Solution**: Check `DATABASE_URL` or use development bypass

### Login Not Working
**Symptom**: Credentials rejected
**Solution**: Use dev credentials: `admin@dev.com` / `devpassword123`

## Migration from Development to Production

1. **Set up database**: Configure PostgreSQL and update `DATABASE_URL`
2. **Remove dev bypass**: Delete `DEV_DAL_BYPASS` from environment
3. **Create admin user**: Use signup form or database seeding
4. **Configure OAuth**: Add Google/other provider credentials
5. **Update secrets**: Generate secure `NEXTAUTH_SECRET`

---

## Ready to Use Templates

This template includes ready-to-use:
- ✅ Authentication system with dev user
- ✅ Dashboard with charts and tables
- ✅ Multi-tenant architecture patterns
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Dark/light theme
- ✅ Internationalization
- ✅ Production deployment ready

Perfect foundation for building SaaS applications! 🚀