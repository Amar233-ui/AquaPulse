"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AquaPulseLogo } from "@/components/aquapulse-logo"
import { useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const citizenNav: NavItem[] = [
  { label: "Accueil", href: "/citoyen", icon: Home },
  { label: "Etat du Reseau", href: "/citoyen/reseau", icon: Activity },
  { label: "Qualite de l'Eau", href: "/citoyen/qualite", icon: Droplets },
  { label: "Signaler", href: "/citoyen/signaler", icon: MessageSquareWarning },
  { label: "Carte Interactive", href: "/citoyen/carte", icon: Map },
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

export function DashboardSidebar({ role }: { role: "citoyen" | "operateur" | "admin" }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = role === "citoyen" ? citizenNav : role === "operateur" ? operatorNav : adminNav
  const roleLabel = role === "citoyen" ? "Citoyen" : role === "operateur" ? "Operateur" : "Administrateur"

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
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
          onClick={() => setCollapsed(!collapsed)}
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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
      </div>
    </aside>
  )
}
