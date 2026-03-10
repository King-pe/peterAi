import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

async function getPayments(userId: string) {
  const supabase = await createClient()

  // First get the bot user
  const { data: botUser } = await supabase
    .from('bot_users')
    .select('id')
    .eq('linked_profile_id', userId)
    .single()

  if (!botUser) {
    return []
  }

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('bot_user_id', botUser.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return payments || []
}

export default async function PortalPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const payments = await getPayments(user.id)

  const totalSpent = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Malipo Yangu</h1>
        <p className="text-muted-foreground">Historia ya malipo yako yote</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jumla Uliyolipa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TZS {totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Malipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Buy More Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold">Nunua Credit Zaidi</h3>
            <p className="text-sm text-muted-foreground">Ongeza credit zako za mazungumzo na AI</p>
          </div>
          <Button asChild>
            <Link href="/portal/buy-credits">
              Nunua Sasa
              <ExternalLink className="ml-2 size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Historia ya Malipo</CardTitle>
          <CardDescription>
            Malipo yako yote
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hakuna malipo bado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Malipo yako yataonyeshwa hapa
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                      </p>
                      <Badge variant={
                        payment.status === 'COMPLETED' ? 'default' :
                        payment.status === 'PENDING' ? 'secondary' : 'destructive'
                      }>
                        {payment.status === 'COMPLETED' ? 'Imekamilika' :
                         payment.status === 'PENDING' ? 'Inasubiri' : 'Imeshindikana'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('sw-TZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {payment.type === 'subscription' ? 'Usajili' : `Credit ${payment.credits_added}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
