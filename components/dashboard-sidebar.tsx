"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  Radio,
  Map,
  Activity,
  Users,
  Settings,
  Cpu,
  FlaskConical,
  BarChart3,
  Droplets,
  MessageSquareWarning,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AquaPulseLogo } from "@/components/aquapulse-logo"
import { useEffect, useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const citizenNav: NavItem[] = [
  { label: "Mon Eau",           href: "/citoyen",          icon: Droplets },
  { label: "Carte Interactive", href: "/citoyen/carte",    icon: Map },
  { label: "Signaler",          href: "/citoyen/signaler", icon: MessageSquareWarning },
]

const operatorNav: NavItem[] = [
  { label: "Tableau de Bord",   href: "/operateur",              icon: LayoutDashboard },
  { label: "Alertes",           href: "/operateur/alertes",      icon: AlertTriangle, badge: 4 },
  { label: "Maintenance",       href: "/operateur/maintenance",  icon: Wrench },
  { label: "Capteurs",          href: "/operateur/capteurs",     icon: Radio },
  { label: "Jumeau Numérique",  href: "/operateur/carte",        icon: Map },
  { label: "Simulateur",        href: "/operateur/simulateur",   icon: FlaskConical },
]

const adminNav: NavItem[] = [
  { label: "Vue Système",     href: "/admin",                  icon: BarChart3 },
  { label: "Utilisateurs",   href: "/admin/utilisateurs",     icon: Users },
  { label: "Capteurs IoT",   href: "/admin/capteurs",         icon: Cpu },
  { label: "Simulations",    href: "/admin/simulations",      icon: FlaskConical },
  { label: "Paramètres",     href: "/admin/parametres",       icon: Settings },
]

export function DashboardSidebar({
  role,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: {
  role: "citoyen" | "operateur" | "admin"
  mobileOpen: boolean
  onMobileClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    onMobileClose()
  }, [pathname])

  const navItems = role === "citoyen" ? citizenNav : role === "operateur" ? operatorNav : adminNav
  const roleLabel = role === "citoyen" ? "Citoyen" : role === "operateur" ? "Opérateur" : "Administrateur"
  const roleColor = role === "citoyen" ? "text-teal-400" : role === "operateur" ? "text-blue-400" : "text-purple-400"
  const roleBg = role === "citoyen" ? "bg-teal-500/10" : role === "operateur" ? "bg-blue-500/10" : "bg-purple-500/10"

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    router.push("/auth/login")
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4 shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <AquaPulseLogo size="sm" />}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label={collapsed ? "Développer" : "Réduire"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              onClick={onMobileClose}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className={cn("mx-3 mt-3 mb-1 rounded-lg px-3 py-2", roleBg)}>
            <p className={cn("text-xs font-semibold tracking-wide uppercase", roleColor)}>{roleLabel}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/citoyen" && item.href !== "/operateur" && item.href !== "/admin")
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive-foreground/80 px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive-foreground/80 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer logout */}
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-destructive-foreground disabled:opacity-50"
            )}
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{isLoggingOut ? "Déconnexion…" : "Déconnexion"}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
