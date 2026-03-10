import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageCircle, CreditCard, Activity, TrendingUp, TrendingDown } from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: activeUsers },
    { data: payments },
    { count: totalMessages },
  ] = await Promise.all([
    supabase.from('bot_users').select('*', { count: 'exact', head: true }),
    supabase.from('bot_users').select('*', { count: 'exact', head: true }).eq('subscription_active', true),
    supabase.from('payments').select('amount').eq('status', 'COMPLETED'),
    supabase.from('logs').select('*', { count: 'exact', head: true }).eq('type', 'ai_chat'),
  ])

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalRevenue,
    totalMessages: totalMessages || 0,
  }
}

async function getRecentActivity() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10)

  return logs || []
}

export default async function AdminDashboardPage() {
  const stats = await getStats()
  const recentActivity = await getRecentActivity()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashibodi ya Admin</h1>
        <p className="text-muted-foreground">Fuatilia na kusimamia bot yako ya WhatsApp</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Watumiaji Wote</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              Watumiaji waliosajiliwa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wanaoendelea</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              Na usajili hai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mapato</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              TZS {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              Jumla ya mapato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jumbe za AI</CardTitle>
            <MessageCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              Mazungumzo na AI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Shughuli za Hivi Karibuni</CardTitle>
          <CardDescription>Kumbukumbu za matukio ya hivi karibuni</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hakuna shughuli bado
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {log.type === 'ai_chat' ? (
                      <MessageCircle className="size-4 text-primary" />
                    ) : log.type === 'payment' ? (
                      <CreditCard className="size-4 text-primary" />
                    ) : (
                      <Activity className="size-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.user_name || log.phone || 'Mtumiaji asiyejulikana'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.command || log.type}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('sw-TZ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
