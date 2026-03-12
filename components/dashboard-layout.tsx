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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        role={role}
        mobileOpen={false}
        onMobileClose={() => {}}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
      />

      {/* pt-16 : compense le header fixe en haut
          pb-16 : compense la bottom nav fixe en bas (mobile uniquement) */}
      <div className={cn(
        "transition-all duration-300 pt-16",
        "pb-16 lg:pb-0",          // espace pour la bottom nav mobile
        collapsed ? "lg:pl-16" : "lg:pl-60"
      )}>
        <DashboardHeader
          title={title}
          onMenuClick={() => {}}  // plus utilisé sur mobile (bottom nav)
        />
        {/* isolation:isolate confine les z-index de Leaflet et empêche
            la carte de passer par-dessus la bottom nav / header */}
        <main
          className={cn(fullscreen ? "p-3 lg:p-4" : "p-4 lg:p-6")}
          style={{ isolation: "isolate" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
