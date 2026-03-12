"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function DashboardLayout({
  children,
  role,
  title,
  fullscreen = false,
}: {
  children: React.ReactNode
  role: "citoyen" | "operateur" | "admin"
  title: string
  fullscreen?: boolean
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        role={role}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
      />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-60")}>
        <DashboardHeader title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className={cn(fullscreen ? "p-3 lg:p-4" : "p-4 lg:p-6")}>
          {children}
        </main>
      </div>
    </div>
  )
}
