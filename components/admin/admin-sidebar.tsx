'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  CreditCard,
  Settings,
  Activity,
  QrCode,
  LogOut,
  ChevronUp,
  Bot,
} from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'
import { signOut } from '@/lib/supabase/actions'

const navItems = [
  {
    title: 'Dashibodi',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Watumiaji wa Bot',
    href: '/admin/bot-users',
    icon: Users,
  },
  {
    title: 'Mazungumzo',
    href: '/admin/conversations',
    icon: MessageCircle,
  },
  {
    title: 'Malipo',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Kumbukumbu',
    href: '/admin/logs',
    icon: Activity,
  },
]

const settingsItems = [
  {
    title: 'Unganisha WhatsApp',
    href: '/admin/connect',
    icon: QrCode,
  },
  {
    title: 'Mipangilio',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar({ user }: { user: Profile }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2 px-2 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">PeterAi</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Kuu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mipangilio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 text-left text-sm">
                    <span className="font-medium truncate">{user.full_name || 'Admin'}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 size-4" />
                    Mipangilio
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut}>
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 size-4" />
                      Toka
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
