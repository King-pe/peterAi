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
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  MessageCircle,
  CreditCard,
  Settings,
  Link as LinkIcon,
  LogOut,
  ChevronUp,
  Bot,
  Coins,
} from 'lucide-react'
import type { Profile, BotUser } from '@/lib/supabase/types'
import { signOut } from '@/lib/supabase/actions'

const navItems = [
  {
    title: 'Dashibodi',
    href: '/portal',
    icon: LayoutDashboard,
  },
  {
    title: 'Mazungumzo',
    href: '/portal/conversations',
    icon: MessageCircle,
  },
  {
    title: 'Malipo',
    href: '/portal/payments',
    icon: CreditCard,
  },
  {
    title: 'Unganisha Simu',
    href: '/portal/link',
    icon: LinkIcon,
  },
  {
    title: 'Mipangilio',
    href: '/portal/settings',
    icon: Settings,
  },
]

export function UserSidebar({ user, botUser }: { user: Profile; botUser: BotUser | null }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/portal" className="flex items-center gap-2 px-2 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">PeterAi</span>
            <span className="text-xs text-muted-foreground">Portal ya Mtumiaji</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Credits Display */}
        {botUser && (
          <SidebarGroup>
            <div className="mx-2 rounded-lg bg-primary/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="size-4 text-primary" />
                <span className="text-xs font-medium">Salio lako</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{botUser.credits}</span>
                <Badge variant={botUser.subscription_active ? 'default' : 'secondary'}>
                  {botUser.subscription_active ? 'Active' : 'Hakuna Usajili'}
                </Badge>
              </div>
            </div>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 text-left text-sm">
                    <span className="font-medium truncate">{user.full_name || 'Mtumiaji'}</span>
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
                  <Link href="/portal/settings">
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
