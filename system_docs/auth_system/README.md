# Sifrex Authentication System Documentation

**Internal Technical Documentation for Development Team and LLM Assistance**

## Overview

This documentation covers the complete NextAuth.js v5 authentication system implementation for Sifrex Web App, including architecture, security features, role-based access control, and development patterns.

## Documentation Structure

```
auth_system/
├── README.md                    # This overview file
├── 01_architecture.md           # System architecture and data flow
├── 02_implementation.md         # Code implementation details
├── 03_security.md              # Security features and patterns
├── 04_rbac_system.md           # Role-based access control
├── 05_development_guide.md     # Development and troubleshooting
└── 06_api_reference.md         # API and function reference
```

## Quick Reference

### Core Files
- `auth.ts` - NextAuth configuration with Prisma adapter
- `auth.config.ts` - Authentication providers and callbacks
- `src/lib/dal.ts` - Data Access Layer (primary security boundary)
- `src/lib/actions/auth.ts` - Server actions for registration
- `src/middleware.ts` - Route protection and security headers
- `prisma/schema.prisma` - Database schema with auth tables

### Key Features
- ✅ NextAuth.js v5 with JWT strategy
- ✅ PostgreSQL database with Prisma ORM
- ✅ 6-tier role system (BASIC → SUPER_ADMIN)
- ✅ Development bypass system for testing
- ✅ Rate limiting and brute force protection
- ✅ Security headers and CSRF protection
- ✅ Multi-layer security architecture
- ✅ bcrypt password hashing (12 rounds)

### Development Status
- ✅ Core authentication implemented
- ✅ Role system functional
- ⚠️ Currently using development bypass mode
- 🚧 Database connection pending (Jira: SWA-1)
- 🚧 Email integration planned (Epic: SWA-2)
- 🚧 2FA implementation planned (Epic: SWA-2)

## Getting Started

1. **Read Architecture** (`01_architecture.md`) - Understand the system design
2. **Review Implementation** (`02_implementation.md`) - Learn code patterns
3. **Study Security** (`03_security.md`) - Understand security measures
4. **Check Development Guide** (`05_development_guide.md`) - Start developing

## Latest Updates

**2025-01-04**: 
- Updated role system to 6-tier structure
- Fixed Prisma client generation issues
- Created comprehensive Jira Epic (SWA-2) for future enhancements
- Documentation creation in progress

## Contact

For questions about this auth system:
- Check development guide for common issues
- Review Jira Epic SWA-2 for planned enhancements
- Consult this documentation for implementation details