
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
  SidebarInset,
  useSidebar,
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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/schedule', label: 'Schedule', icon: CalendarCheck },
  { href: '/trips', label: 'Trip Planner', icon: Plane },
  { href: '/admin', label: 'Admin Settings', icon: Settings, adminOnly: true },
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
              src={`https://placehold.co/40x40.png`}
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
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
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
  const { open } = useSidebar();
  
  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.adminOnly && user.role !== 'admin') {
          return null;
        }
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
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
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" side="left">
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
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex-1" />
            <UserMenu user={user} />
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
          <footer className="p-4 text-center text-sm text-muted-foreground">
            Copyright Da Bois 2025. All Rights Reserved. Developed by Don Wong.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
