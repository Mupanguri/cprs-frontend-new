"use client"

import type React from "react"
import { useSession, signOut } from "next-auth/react" // Import useSession and signOut
import { usePathname, useRouter } from "next/navigation" // Import useRouter for redirect
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
// Removed Calendar, CreditCard, Settings icons as pages are removed for now
import { Home, User, FileText, Users as AdminUsersIcon, Settings as GuildsIcon, LogOut } from "lucide-react" 
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react" // Import useEffect for redirecting unauthenticated users

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession() // Get session data and status

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  // Determine if user is admin based on session role
  const isAdmin = session?.user?.role === 'admin'

  // Define navigation items based on role
  const baseNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
    // Removed Calendar and Payments links for now
  ]

  const adminOnlyNavItems = [
    // Corrected paths for admin pages
    { href: "/dashboard/admin/users", label: "Users", icon: AdminUsersIcon }, 
    { href: "/dashboard/admin/guilds", label: "Guilds", icon: GuildsIcon }, 
    // Removed Settings link for now
  ]

  const navItems = isAdmin ? [...baseNavItems, ...adminOnlyNavItems] : baseNavItems

  // Handle loading state
  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading session...</div>;
  }
  
  // If unauthenticated after check (should be redirected by useEffect, but as fallback)
  if (status === "unauthenticated") {
     return null; // Or a message indicating redirection
  }

  // Get user name or email for display
  const userName = session?.user?.name || session?.user?.email || "User"

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="flex items-center px-4 py-2">
            <div className="flex items-center space-x-2">
              {/* Corrected image path */}
              <Image src="/dashboard%20icon.png" alt="St. Agnes Parish" width={40} height={40} className="rounded-full" />
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
              {/* Added onClick handler for logout */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut({ callbackUrl: '/' })}
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2" />
              {/* Simplified header title logic - consider deriving from navItems */}
              <h1 className="text-xl font-semibold capitalize">
                 {navItems.find(item => item.href === pathname)?.label || pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Display dynamic user name/email */}
              <span className="text-sm font-medium">{userName}</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
