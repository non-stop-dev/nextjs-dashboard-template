// File: /src/lib/prisma.ts
// Global Prisma Client instance with connection pooling and security

import 'server-only'

import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma Client Instance
 * 
 * This pattern prevents multiple Prisma Client instances in development
 * due to Next.js hot reloading. In production, creates a single instance.
 * 
 * SECURITY NOTES:
 * - Import 'server-only' prevents client-side usage
 * - Connection pooling configured for production performance
 * - Proper logging levels for different environments
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Connection pool configuration for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Graceful shutdown handling
 * Ensures database connections are properly closed
 */
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})