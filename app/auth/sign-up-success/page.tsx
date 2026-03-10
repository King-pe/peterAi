import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'

export default function SignUpSuccessPage() {
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
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Angalia Barua Pepe Yako</CardTitle>
            <CardDescription>
              Tumekutumia barua pepe ya kuthibitisha akaunti yako
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bonyeza kiungo kilichomo kwenye barua pepe kuthibitisha akaunti yako.
              Kisha utaweza kuingia na kutumia huduma zote za PeterAi.
            </p>
            
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Haukupokea barua pepe?</p>
              <p className="text-muted-foreground">
                Angalia folda ya spam au jaribu tena baada ya dakika chache.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Nenda kwenye Kuingia
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
