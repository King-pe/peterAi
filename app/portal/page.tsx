import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { MessageCircle, CreditCard, Coins, Clock, ArrowRight, Link as LinkIcon } from 'lucide-react'

async function getUserData(userId: string) {
  const supabase = await createClient()

  // Get linked bot user
  const { data: botUser } = await supabase
    .from('bot_users')
    .select('*')
    .eq('linked_profile_id', userId)
    .single()

  if (!botUser) {
    return { botUser: null, conversations: [], payments: [] }
  }

  // Get recent conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('bot_user_id', botUser.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // Get recent payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('bot_user_id', botUser.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    botUser,
    conversations: conversations || [],
    payments: payments || [],
  }
}

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { botUser, conversations, payments } = await getUserData(user.id)

  // If no bot user linked, show link prompt
  if (!botUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portal ya Mtumiaji</h1>
          <p className="text-muted-foreground">Fuatilia na kusimamia akaunti yako ya WhatsApp Bot</p>
        </div>

        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
              <LinkIcon className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Unganisha Nambari Yako</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Hujaiunganisha nambari yako ya WhatsApp na akaunti hii bado. 
                Unganisha sasa ili kuona mazungumzo na salio lako.
              </p>
            </div>
            <Button asChild>
              <Link href="/portal/link">
                Unganisha Sasa
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portal ya Mtumiaji</h1>
        <p className="text-muted-foreground">Fuatilia na kusimamia akaunti yako ya WhatsApp Bot</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salio</CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botUser.credits}</div>
            <p className="text-xs text-muted-foreground">
              Credit zilizobaki
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usajili</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={botUser.subscription_active ? 'default' : 'secondary'}>
              {botUser.subscription_active ? 'Hai' : 'Hakuna'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {botUser.subscription_plan === 'monthly' ? 'Kila mwezi' : 
               botUser.subscription_plan === 'credits' ? 'Credit' : 'Bure'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jumbe</CardTitle>
            <MessageCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botUser.total_messages}</div>
            <p className="text-xs text-muted-foreground">
              Mazungumzo na AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Muda wa Mwisho</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(botUser.last_active).toLocaleDateString('sw-TZ')}
            </div>
            <p className="text-xs text-muted-foreground">
              Mara ya mwisho kutumia
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mazungumzo ya Hivi Karibuni</CardTitle>
              <CardDescription>Mazungumzo yako na AI</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/conversations">
                Ona Yote
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Hakuna mazungumzo bado
              </p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div key={conv.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MessageCircle className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title || 'Mazungumzo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString('sw-TZ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Malipo ya Hivi Karibuni</CardTitle>
              <CardDescription>Historia ya malipo yako</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/payments">
                Ona Yote
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Hakuna malipo bado
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        TZS {Number(payment.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('sw-TZ')}
                      </p>
                    </div>
                    <Badge variant={
                      payment.status === 'COMPLETED' ? 'default' :
                      payment.status === 'PENDING' ? 'secondary' : 'destructive'
                    }>
                      {payment.status === 'COMPLETED' ? 'Imekamilika' :
                       payment.status === 'PENDING' ? 'Inasubiri' : 'Imeshindikana'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
