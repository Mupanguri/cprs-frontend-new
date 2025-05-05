"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, User, FileText, Calendar, CreditCard, Users, Settings, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(true) // This would come from auth context in a real app

  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  ]

  const adminNavItems = [
    ...userNavItems,
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/guilds", label: "Guilds", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="flex items-center px-4 py-2">
            <div className="flex items-center space-x-2">
              <Image src="/dashboard-icon.png" alt="St. Agnes Parish" width={40} height={40} className="rounded-full" />
              <div className="font-semibold">St. Agnes Parish</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center justify-between">
              <ModeToggle />
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-xl font-semibold">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : pathname === "/dashboard/profile"
                    ? "My Profile"
                    : pathname === "/dashboard/documents"
                      ? "Documents"
                      : pathname === "/dashboard/calendar"
                        ? "Calendar"
                        : pathname === "/dashboard/payments"
                          ? "Payments"
                          : pathname === "/dashboard/users"
                            ? "Users"
                            : pathname === "/dashboard/guilds"
                              ? "Guilds"
                              : pathname === "/dashboard/settings"
                                ? "Settings"
                                : "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">John Doe</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
