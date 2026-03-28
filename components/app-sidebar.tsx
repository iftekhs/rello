'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LayoutBottomIcon,
  UserMultipleIcon,
  KanbanIcon,
} from '@hugeicons/core-free-icons';

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
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

  const teams = [
    {
      name: 'rello',
      logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
      plan: 'Workspace',
    },
  ];

  const defaultUser = {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || defaultUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
