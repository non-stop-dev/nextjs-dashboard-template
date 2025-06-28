// File: /src/lib/actions/auth.ts
// Server Actions for authentication (signup, password reset, email validation)

'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignupFormSchema, type FormState } from '@/lib/definitions'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Server Action: User Registration
 * 
 * SECURITY NOTES:
 * - All inputs are validated server-side with Zod
 * - Passwords are hashed with bcryptjs (12 rounds)
 * - Email uniqueness enforced at DB level
 * - No sensitive data leaked in error responses
 * 
 * @param prevState - Previous form state (for progressive enhancement)
 * @param formData - Form data from client
 * @returns FormState with errors or success indication
 */
export async function signup(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // 1. VALIDATE INPUT DATA
  const validationResult = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // Return validation errors if input is invalid
  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validationResult.data

  try {
    // 2. CHECK IF USER ALREADY EXISTS
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // Minimal data exposure
    })

    if (existingUser) {
      return {
        message: 'A user with this email already exists.',
      }
    }

    // 3. HASH PASSWORD SECURELY
    const hashedPassword = await bcrypt.hash(password, 12)

    // 4. CREATE USER IN DATABASE
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // Default role for new registrations
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }, // Return only safe fields
    })

    // Success - no errors returned
    return {
      message: 'Account created successfully! Please sign in.',
    }

  } catch (error) {
    // 5. HANDLE DATABASE ERRORS SECURELY
    console.error('Signup error:', error)

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        return {
          message: 'A user with this email already exists.',
        }
      }
    }

    // Generic error for production (don't leak implementation details)
    return {
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Server Action: Email Availability Check
 * 
 * Used for progressive enhancement - can be called via AJAX
 * to check email availability without full form submission
 * 
 * @param email - Email to check
 * @returns boolean indicating availability
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  // Validate email format
  const emailSchema = z.string().email()
  const validationResult = emailSchema.safeParse(email)

  if (!validationResult.success) {
    return false // Invalid email format
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: validationResult.data },
      select: { id: true },
    })

    return !existingUser // Available if no existing user found
  } catch (error) {
    console.error('Email availability check error:', error)
    return false // Conservative approach - assume unavailable on error
  }
}

/**
 * Server Action: Password Reset Request
 * 
 * Generates and sends password reset tokens
 * Note: Implementation depends on your email service choice
 * 
 * @param email - User email requesting reset
 * @returns FormState indicating success/failure
 */
export async function requestPasswordReset(email: string): Promise<FormState> {
  const emailSchema = z.string().email()
  const validationResult = emailSchema.safeParse(email)

  if (!validationResult.success) {
    return {
      errors: { email: ['Please enter a valid email address.'] },
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validationResult.data },
      select: { id: true, email: true },
    })

    // Always return success message for security
    // (Don't reveal if email exists in system)
    const successMessage = 'If an account exists with this email, you will receive password reset instructions.'

    if (!user) {
      return { message: successMessage }
    }

    // TODO: Generate reset token and send email
    // This would typically involve:
    // 1. Generate secure random token
    // 2. Store token in database with expiration
    // 3. Send email with reset link
    // 4. Return success message

    return { message: successMessage }

  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}