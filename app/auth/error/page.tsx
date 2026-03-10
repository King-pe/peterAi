import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
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
        
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Kuna Tatizo</CardTitle>
            <CardDescription>
              Kumekuwa na tatizo wakati wa kuingia
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Huenda kiungo kilichotumika kimetumika tayari au kimekwisha muda wake.
              Tafadhali jaribu tena au wasiliana na msaada.
            </p>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Jaribu Kuingia Tena
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/sign-up">
                Unda Akaunti Mpya
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
