'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserMultipleIcon, KanbanIcon } from '@hugeicons/core-free-icons';
import { Workspace } from './workspace';

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
      isActive: pathname === '/dashboard/users',
      items: [],
    },
    {
      title: 'Boards',
      url: '/dashboard/boards',
      icon: <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} />,
      isActive: pathname === '/dashboard/boards',
      items: [],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Workspace />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
