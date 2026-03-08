"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function DashboardLayout({
  children,
  role,
  title,
}: {
  children: React.ReactNode
  role: "citoyen" | "operateur" | "admin"
  title: string
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
        onToggleCollapse={() => setCollapsed((previous) => !previous)}
      />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <DashboardHeader title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
