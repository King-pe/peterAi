import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, Coins, Calendar, MessageCircle } from 'lucide-react'

async function getBotUsers() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('bot_users')
    .select('*')
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching bot users:', error)
    return []
  }

  return users || []
}

export default async function BotUsersPage() {
  const users = await getBotUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Watumiaji wa Bot</h1>
        <p className="text-muted-foreground">Orodha ya watumiaji wote wa WhatsApp bot</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watumiaji ({users.length})</CardTitle>
          <CardDescription>
            Watumiaji wote waliosajiliwa na bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hakuna watumiaji bado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nambari</TableHead>
                    <TableHead>Jina</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Usajili</TableHead>
                    <TableHead>Jumbe</TableHead>
                    <TableHead>Amesajiliwa</TableHead>
                    <TableHead>Hali</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-muted-foreground" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="size-4 text-primary" />
                          {user.credits}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscription_active ? 'default' : 'secondary'}>
                          {user.subscription_active 
                            ? user.subscription_plan === 'monthly' ? 'Kila Mwezi' : 'Credit'
                            : 'Hakuna'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="size-4 text-muted-foreground" />
                          {user.total_messages}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4 text-muted-foreground" />
                          {new Date(user.joined_at).toLocaleDateString('sw-TZ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.banned ? 'destructive' : 'outline'}>
                          {user.banned ? 'Amezuiwa' : 'Hai'}
                        </Badge>
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
