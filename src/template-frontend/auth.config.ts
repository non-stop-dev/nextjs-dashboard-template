import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { SigninFormSchema } from '@/lib/definitions'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limiting'

const prisma = new PrismaClient()

export default {
  providers: [
    // Google OAuth Provider
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    // Email/Password Credentials
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com"
        },
        password: {
          label: "Password", 
          type: "password",
          placeholder: "Your password"
        }
      },
      async authorize(credentials) {
        try {
          // Validate credentials using Zod
          const parsedCredentials = SigninFormSchema.safeParse(credentials)

          if (!parsedCredentials.success) {
            // SECURITY: Don't log sensitive validation errors in production
            if (process.env.NODE_ENV === 'development') {
              console.log('Invalid credentials format')
            }
            return null
          }

          const { email, password } = parsedCredentials.data
          
          // SECURITY: Rate limiting to prevent brute force attacks
          const rateLimitResult = checkRateLimit(email);
          if (!rateLimitResult.allowed) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Rate limit exceeded for ${email}`);
            }
            return null;
          }
          
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
            }
          })

          if (!user || !user.password) {
            if (process.env.NODE_ENV === 'development') {
              console.log('User not found or no password set')
            }
            return null
          }

          // Verify password
          const passwordsMatch = await bcrypt.compare(password, user.password)
          
          if (!passwordsMatch) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Password does not match')
            }
            return null
          }

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.log('Error in authorize:', error)
          return null
        }
      },
    }),
  ],
  
  pages: {
    signIn: '/signin',
    // signUp no existe en NextAuth, usaremos ruta custom
  },
  
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.includes('/dashboard')
      
      // Extract locale from path
      const locale = nextUrl.pathname.split('/')[1] || 'es'
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl))
      }
      
      return true
    },
    
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    
    session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig