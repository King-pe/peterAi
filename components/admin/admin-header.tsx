'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

const pathNames: Record<string, string> = {
  '/admin': 'Dashibodi',
  '/admin/bot-users': 'Watumiaji wa Bot',
  '/admin/conversations': 'Mazungumzo',
  '/admin/payments': 'Malipo',
  '/admin/logs': 'Kumbukumbu',
  '/admin/connect': 'Unganisha WhatsApp',
  '/admin/settings': 'Mipangilio',
}

export function AdminHeader({ user }: { user: Profile }) {
  const pathname = usePathname()
  const currentPage = pathNames[pathname] || 'Dashibodi'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/admin">
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">
          Umeingia kama: <span className="font-medium text-foreground">{user.full_name || user.email}</span>
        </span>
      </div>
    </header>
  )
}
