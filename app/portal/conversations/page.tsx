import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

async function getConversations(userId: string) {
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

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('bot_user_id', botUser.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return conversations || []
}

export default async function PortalConversationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const conversations = await getConversations(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mazungumzo Yangu</h1>
        <p className="text-muted-foreground">Ona historia ya mazungumzo yako na AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mazungumzo ({conversations.length})</CardTitle>
          <CardDescription>
            Mazungumzo yako yote na PeterAi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hakuna mazungumzo bado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tuma ujumbe kupitia WhatsApp kuanza mazungumzo na AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div key={conv.id} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.title || 'Mazungumzo'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString('sw-TZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
