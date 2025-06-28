// app/[locale]/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock } from 'lucide-react'
import GoogleIcon from '@/assets/icons/google.svg'
import React from 'react'

// Ajusta el tipo de params para reflejar que es una Promise
export default function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // DESENVUELVE la Promesa params usando React.use()
  const resolvedParams = React.use(params);
  const { locale } = resolvedParams; // Destructura locale del objeto resuelto
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // SECURITY: Validate callback URL to prevent open redirects
  const validateCallbackUrl = (url: string | null): string => {
    if (!url) return `/${locale}/dashboard`;
    
    // Only allow relative URLs starting with the current locale
    if (url.startsWith(`/${locale}/`) && !url.includes('://')) {
      return url;
    }
    
    // Fallback to dashboard if invalid
    return `/${locale}/dashboard`;
  }
  
  const callbackUrl = validateCallbackUrl(searchParams.get('callbackUrl'))
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials. Please try again.')
      } else {
        // Asegúrate de que router.push maneje el locale correctamente si callbackUrl no lo tiene.
        // Pero tu callbackUrl ya lo incluye, así que está bien.
        router.push(callbackUrl)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // callbackUrl ya incluye el locale, lo cual es correcto.
      await signIn('google', { callbackUrl }) 
    } catch {
      setError('Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  return (
    // Contenido JSX de tu página de login (como lo tienes ahora)
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
          >
            <Image 
              src={GoogleIcon} 
              alt="Google" 
              width={16} 
              height={16} 
              className="mr-2"
            />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={`/${locale}/signup`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm text-center text-muted-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}