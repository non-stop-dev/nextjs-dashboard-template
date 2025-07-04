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

// Export database connection check for development
export { isDatabaseConnected }