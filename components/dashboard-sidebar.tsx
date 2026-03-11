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
}

const citizenNav: NavItem[] = [
  { label: "Accueil", href: "/citoyen", icon: Home },
  { label: "Carte Interactive", href: "/citoyen/carte", icon: Map },
  { label: "Signaler", href: "/citoyen/signaler", icon: MessageSquareWarning },
]

const operatorNav: NavItem[] = [
  { label: "Tableau de Bord", href: "/operateur", icon: LayoutDashboard },
  { label: "Alertes", href: "/operateur/alertes", icon: AlertTriangle },
  { label: "Maintenance", href: "/operateur/maintenance", icon: Wrench },
  { label: "Capteurs", href: "/operateur/capteurs", icon: Radio },
  { label: "Jumeau Numerique", href: "/operateur/carte", icon: Map },
  { label: "Simulateur", href: "/operateur/simulateur", icon: FlaskConical },
]

const adminNav: NavItem[] = [
  { label: "Vue Systeme", href: "/admin", icon: BarChart3 },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
  { label: "Capteurs IoT", href: "/admin/capteurs", icon: Cpu },
  { label: "Simulations", href: "/admin/simulations", icon: FlaskConical },
  { label: "Parametres", href: "/admin/parametres", icon: Settings },
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
  const roleLabel = role === "citoyen" ? "Citoyen" : role === "operateur" ? "Operateur" : "Administrateur"

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } finally {
      onMobileClose()
      router.push("/auth/login")
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/">
              <AquaPulseLogo size="sm" className="text-sidebar-foreground" />
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Droplets className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:block"
            aria-label={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              {roleLabel}
            </span>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Home className="h-4 w-4" />
              <span>{"Retour a l'accueil"}</span>
            </Link>
          )}
          {collapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-2 flex w-full items-center justify-center rounded-lg px-2 py-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Se deconnecter"
              title="Se deconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Deconnexion..." : "Se deconnecter"}</span>
            </button>
          )}
        </div>
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <button
          className={cn("absolute inset-0 bg-black/40 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={onMobileClose}
          aria-label="Fermer le menu"
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/" onClick={onMobileClose}>
              <AquaPulseLogo size="sm" className="text-sidebar-foreground" />
            </Link>
            <button
              className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={onMobileClose}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">{roleLabel}</span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Home className="h-4 w-4" />
              <span>{"Retour a l'accueil"}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Deconnexion..." : "Se deconnecter"}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
