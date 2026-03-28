'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function Workspace() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-warm-red/20 text-sidebar-primary-foreground">
            <img
              src="https://oumts6nefv.ufs.sh/f/xb97pP2S5jPK2M79GRuZ0x5VmlQT1DLPU3gJvzwdutNnY8A9"
              className="size-4"
              alt="logo-icon"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Rello</span>
            <span className="truncate text-xs">Workspace</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
