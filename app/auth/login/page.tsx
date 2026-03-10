'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirect')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Get user profile to determine redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      toast.success('Umeingia vizuri!')
      
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push(profile?.role === 'admin' ? '/admin' : '/portal')
      }
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Karibu Tena</CardTitle>
        <CardDescription>
          Ingia kwenye akaunti yako ya PeterAi
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Barua pepe</Label>
            <Input
              id="email"
              type="email"
              placeholder="wewe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Nenosiri</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Umesahau nenosiri?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Inaingia...
              </>
            ) : (
              'Ingia'
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            Huna akaunti?{' '}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              Jisajili sasa
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function LoginFormSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Karibu Tena</CardTitle>
        <CardDescription>
          Inapakia...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Rudi Nyumbani
        </Link>
        
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
