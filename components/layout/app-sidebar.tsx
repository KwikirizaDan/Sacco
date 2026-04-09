"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Banknote,
  PiggyBank,
  AlertCircle,
  Settings,
  FileText,
  Bell,
  MessageSquare,
  HelpCircle,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { title: "Members", href: "/members", icon: Users },
      { title: "Complaints", href: "/complaints", icon: MessageSquare },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Loans", href: "/loans", icon: Banknote },
      { title: "Savings", href: "/savings", icon: PiggyBank },
      { title: "Fines", href: "/fines", icon: AlertCircle },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Reports", href: "/reports", icon: FileText },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Support", href: "/support", icon: HelpCircle },
    ],
  },
  {
    label: "Config",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="SACCO Manager">
              <Link
                href="/dashboard"
                prefetch={true}
                className="flex w-full items-center gap-2"
              >
                <img
                  src="/sacco_logo_dark.svg"
                  alt="SACCO Logo"
                  className="size-8 shrink-0"
                />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">SACCO</span>
                  <span className="text-xs text-muted-foreground">
                    Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={isActive} tooltip={item.title}>
                      <Link
                        href={item.href}
                        prefetch={true}
                        className={cn("flex w-full items-center gap-2")}
                      >
                        <item.icon className="shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Account">
              <UserButton />
              <span className="text-sm font-medium">Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
