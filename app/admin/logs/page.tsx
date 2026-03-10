import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, CreditCard, Activity, AlertTriangle, Terminal } from 'lucide-react'

async function getLogs() {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  return logs || []
}

function getLogIcon(type: string) {
  switch (type) {
    case 'ai_chat':
      return <MessageCircle className="size-4 text-primary" />
    case 'payment':
      return <CreditCard className="size-4 text-green-500" />
    case 'command':
      return <Terminal className="size-4 text-blue-500" />
    case 'error':
      return <AlertTriangle className="size-4 text-destructive" />
    default:
      return <Activity className="size-4 text-muted-foreground" />
  }
}

function getLogBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'ai_chat':
      return 'default'
    case 'payment':
      return 'secondary'
    case 'error':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default async function LogsPage() {
  const logs = await getLogs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kumbukumbu</h1>
        <p className="text-muted-foreground">Fuatilia shughuli zote za bot</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kumbukumbu za Hivi Karibuni</CardTitle>
          <CardDescription>
            Kumbukumbu 100 za mwisho
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hakuna kumbukumbu bado
            </p>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {log.user_name || log.phone || 'System'}
                          </span>
                          <Badge variant={getLogBadgeVariant(log.type)}>
                            {log.type === 'ai_chat' ? 'AI Chat' :
                             log.type === 'payment' ? 'Malipo' :
                             log.type === 'command' ? 'Amri' :
                             log.type === 'error' ? 'Kosa' : 'System'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('sw-TZ')}
                          </span>
                        </div>
                        
                        {log.command && (
                          <p className="mt-1 text-sm">
                            <span className="text-muted-foreground">Amri:</span>{' '}
                            <code className="rounded bg-muted px-1">{log.command}</code>
                          </p>
                        )}
                        
                        {log.message && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium text-foreground">Ujumbe:</span> {log.message}
                          </p>
                        )}
                        
                        {log.response && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium text-foreground">Jibu:</span> {log.response}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
