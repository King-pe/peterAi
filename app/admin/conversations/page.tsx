import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MessageCircle, Calendar, User } from 'lucide-react'

async function getConversations() {
  const supabase = await createClient()

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      bot_users (
        phone,
        name
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return conversations || []
}

export default async function ConversationsPage() {
  const conversations = await getConversations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mazungumzo</h1>
        <p className="text-muted-foreground">Orodha ya mazungumzo yote na AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mazungumzo ({conversations.length})</CardTitle>
          <CardDescription>
            Mazungumzo 50 ya hivi karibuni
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hakuna mazungumzo bado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mtumiaji</TableHead>
                    <TableHead>Mada</TableHead>
                    <TableHead>Muda wa Kuunda</TableHead>
                    <TableHead>Muda wa Mwisho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {conv.bot_users?.name || conv.bot_users?.phone || 'Unknown'}
                            </p>
                            {conv.bot_users?.name && (
                              <p className="text-xs text-muted-foreground">
                                {conv.bot_users.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="size-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {conv.title || 'Mazungumzo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4 text-muted-foreground" />
                          {new Date(conv.created_at).toLocaleDateString('sw-TZ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4 text-muted-foreground" />
                          {new Date(conv.updated_at).toLocaleDateString('sw-TZ')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
