'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/utils/url'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  
  // Get the redirect URL on mount to ensure we have the correct domain
  useEffect(() => {
    // If NEXT_PUBLIC_APP_URL is set, use it directly (most reliable)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      setRedirectUrl(`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)
    } else {
      // Otherwise use the utility function (will use window.location.origin)
      setRedirectUrl(getAuthCallbackUrl())
    }
  }, [])
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)
    
    // Use the redirect URL we determined, or fallback to the utility function
    const callbackUrl = redirectUrl || getAuthCallbackUrl()
    
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
      },
    })
    
    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
    } else {
      router.push('/collections')
      router.refresh()
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="email"
      />
      
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="new-password"
        minLength={6}
      />
      
      <Input
        type="password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="new-password"
        minLength={6}
      />
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Signing up...
          </span>
        ) : (
          'Sign Up'
        )}
      </Button>
    </form>
  )
}


