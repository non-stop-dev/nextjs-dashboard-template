import { z } from 'zod'

// Form validation schemas
export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})

export const SigninFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
})

// Form state types
export type FormState =
  | {
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

// Session payload type
export type SessionPayload = {
  userId: string
  expiresAt: Date
}

// User types
export type User = {
  id: string
  name: string | null
  email: string
  role: 'BASIC' | 'PLUS' | 'PREMIUM' | 'PREMIUM_PLUS' | 'ADMIN' | 'SUPER_ADMIN'
}

// Extend NextAuth types
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