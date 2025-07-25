
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logoutAction } from '@/app/actions';
import { Icons } from '@/components/icons';
import type { User } from '@/lib/types';
import {
  Home,
  Calendar,
  CalendarCheck,
  Plane,
  Settings,
  LogOut,
  ChevronDown,
  MessageSquare,
  User as UserIcon,
  BookMarked,
  FilePenLine,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, allowedRoles: ['admin', 'member', 'parent'] },
  { href: '/events', label: 'Events', icon: Calendar, allowedRoles: ['admin', 'member', 'parent'] },
  { href: '/schedule', label: 'Schedule', icon: CalendarCheck, allowedRoles: ['admin', 'member', 'parent'] },
  { href: '/trips', label: 'Trip Planner', icon: Plane, allowedRoles: ['admin', 'member', 'parent'] },
  { href: '/chat', label: 'Chat', icon: MessageSquare, allowedRoles: ['admin', 'member'] },
];

const wikiNavItems = [
    { href: '/wiki', label: 'View All Pages', icon: BookMarked, allowedRoles: ['admin', 'member'] },
    { href: '/wiki/new', label: 'New Page', icon: FilePenLine, allowedRoles: ['admin', 'member'] },
];

function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.profilePictureUrl}
              alt={user.name}
              data-ai-hint="user avatar"
            />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{user.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
         {user.role !== 'parent' && (
             <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </Link>
            </DropdownMenuItem>
         )}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-left">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MainNav({ user }: { user: User }) {
  const pathname = usePathname();
  
  const filteredNavItems = navItems.filter(item => user && item.allowedRoles.includes(user.role));
  const canSeeWiki = user.role === 'admin' || user.role === 'member';

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              href={item.href}
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      )}
      {canSeeWiki && (
          <Collapsible asChild>
            <>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isSubmenu
                            isActive={pathname.startsWith('/wiki')}
                            tooltip="Wiki"
                            >
                            <BookMarked className="h-5 w-5" />
                            <span>Wiki</span>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent asChild>
                    <SidebarMenuSub>
                        {wikiNavItems.map((item) => (
                           <SidebarMenuItem key={item.href}>
                             <SidebarMenuButton
                                asChild
                                href={item.href}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                                className="h-8"
                              >
                                <Link href={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuButton>
                           </SidebarMenuItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </>
          </Collapsible>
      )}

       <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                href="/profile"
                isActive={pathname.startsWith('/profile')}
                tooltip="Profile"
            >
                <Link href="/profile">
                    <UserIcon className="h-5 w-5" />
                    <span>Profile</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>

      {user.role === 'admin' && (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                href="/admin"
                isActive={pathname.startsWith('/admin')}
                tooltip="Admin Settings"
            >
                <Link href="/admin">
                    <Settings className="h-5 w-5" />
                    <span>Admin Settings</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
       <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar collapsible="icon" side="left" className="hidden md:block">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Icons.Logo className="h-8 w-8 text-primary" />
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                Da Bois Portal
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav user={user} />
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="w-full flex-1" />
            <ThemeToggle />
            <UserMenu user={user} />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {children}
          </main>
          <footer className="p-4 text-center text-sm text-muted-foreground border-t">
            Copyright Da Bois 2025. All Rights Reserved. Developed by Don Wong.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
