import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserSidebar } from '@/components/portal/user-sidebar'
import { UserHeader } from '@/components/portal/user-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/portal')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get linked bot user if exists
  const { data: botUser } = await supabase
    .from('bot_users')
    .select('*')
    .eq('linked_profile_id', user.id)
    .single()

  return (
    <SidebarProvider>
      <UserSidebar user={profile!} botUser={botUser} />
      <SidebarInset>
        <UserHeader user={profile!} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
