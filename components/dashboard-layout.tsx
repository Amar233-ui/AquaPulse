"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export function DashboardLayout({
  children,
  role,
  title,
}: {
  children: React.ReactNode
  role: "citoyen" | "operateur" | "admin"
  title: string
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      <div className="lg:pl-64">
        <DashboardHeader title={title} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
