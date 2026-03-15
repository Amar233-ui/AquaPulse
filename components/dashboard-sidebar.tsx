"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  Radio,
  Map,
  Users,
  Settings,
  Cpu,
  FlaskConical,
  BarChart3,
  Droplets,
  MessageSquareWarning,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AquaPulseLogo } from "@/components/aquapulse-logo"
import { useEffect, useState } from "react"
import { useApiQuery } from "@/hooks/use-api-query"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  liveCount?: boolean // fetch dynamique depuis l'API
}

const citizenNav: NavItem[] = [
  { label: "Mon Eau",  href: "/citoyen",          icon: Droplets },
  { label: "Carte",    href: "/citoyen/carte",    icon: Map },
  { label: "Signaler", href: "/citoyen/signaler", icon: MessageSquareWarning },
]

const operatorNav: NavItem[] = [
  { label: "Tableau",        href: "/operateur",                icon: LayoutDashboard },
  { label: "Alertes",        href: "/operateur/alertes",        icon: AlertTriangle,         badge: 4 },
  { label: "Signalements",   href: "/operateur/signalements",   icon: MessageSquareWarning,  liveCount: true },
  { label: "Jumeau",         href: "/operateur/carte",          icon: Map },
  { label: "Maintenance",    href: "/operateur/maintenance",    icon: Wrench },
  { label: "Capteurs",       href: "/operateur/capteurs",       icon: Radio },
  { label: "Simulateur",     href: "/operateur/simulateur",     icon: FlaskConical },
]

const adminNav: NavItem[] = [
  { label: "Vue Système",  href: "/admin",               icon: BarChart3 },
  { label: "Utilisateurs", href: "/admin/utilisateurs",  icon: Users },
  { label: "Capteurs IoT", href: "/admin/capteurs",      icon: Cpu },
  { label: "Simulations",  href: "/admin/simulations",   icon: FlaskConical },
  { label: "Paramètres",   href: "/admin/parametres",    icon: Settings },
]

const ROLE_COLOR: Record<string, { text: string; bg: string; bar: string }> = {
  citoyen:   { text: "text-teal-400",   bg: "bg-teal-500/10",   bar: "#2dd4bf" },
  operateur: { text: "text-blue-400",   bg: "bg-blue-500/10",   bar: "#60a5fa" },
  admin:     { text: "text-purple-400", bg: "bg-purple-500/10", bar: "#c084fc" },
}

const BOTTOM_MAX = 4

// Hook pour fetch le nombre de nouveaux signalements en live
function useLiveSignalementsCount(enabled: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/operateur/signalements", { credentials: "include", cache: "no-store" })
        if (!res.ok || cancelled) return
        const json = await res.json() as { summary: { nouveau: number } }
        if (!cancelled) setCount(json?.summary?.nouveau ?? 0)
      } catch {}
    }
    void fetchCount()
    const id = setInterval(fetchCount, 30000) // refresh every 30s
    return () => { cancelled = true; clearInterval(id) }
  }, [enabled])
  return count
}

export function DashboardSidebar({
  role, mobileOpen, onMobileClose, collapsed, onToggleCollapse,
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
  const [moreOpen, setMoreOpen] = useState(false)

  // Live badge pour les signalements (opérateur uniquement)
  const liveSignalementsCount = useLiveSignalementsCount(role === "operateur")

  useEffect(() => {
    onMobileClose()
    setMoreOpen(false)
  }, [pathname])

  const baseNavItems = role === "citoyen" ? citizenNav : role === "operateur" ? operatorNav : adminNav

  // Injecter le badge live sur l'item Signalements
  const navItems: NavItem[] = baseNavItems.map(item =>
    item.liveCount && role === "operateur"
      ? { ...item, badge: liveSignalementsCount > 0 ? liveSignalementsCount : undefined }
      : item
  )

  const roleLabel = role === "citoyen" ? "Citoyen" : role === "operateur" ? "Opérateur" : "Administrateur"
  const roleColor = ROLE_COLOR[role]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try { await fetch("/api/auth/logout", { method: "POST" }) } catch {}
    router.push("/auth/login")
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && pathname.startsWith(href) &&
     href !== "/citoyen" && href !== "/operateur" && href !== "/admin")

  const needsMore   = navItems.length > BOTTOM_MAX
  const bottomItems = needsMore ? navItems.slice(0, BOTTOM_MAX - 1) : navItems
  const moreItems   = needsMore ? navItems.slice(BOTTOM_MAX - 1) : []
  const moreActive  = moreItems.some(i => isActive(i.href))

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose}/>
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[9998] flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        "hidden lg:flex",
        collapsed ? "w-16" : "w-60",
      )}>
        {/* Header */}
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4 shrink-0", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <AquaPulseLogo size="sm"/>}
          <div className="flex items-center gap-1">
            <button onClick={onToggleCollapse}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label={collapsed ? "Développer" : "Réduire"}>
              {collapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4"/>}
            </button>
            <button onClick={onMobileClose}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <X className="h-4 w-4"/>
            </button>
          </div>
        </div>

        {/* Badge rôle */}
        {!collapsed && (
          <div className={cn("mx-3 mt-3 mb-1 rounded-lg px-3 py-2", roleColor.bg)}>
            <p className={cn("text-xs font-semibold tracking-wide uppercase", roleColor.text)}>{roleLabel}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const badgeCount = item.badge && item.badge > 0 ? item.badge : null
            return (
              <Link key={item.label} href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group overflow-hidden",
                  active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.label : undefined}>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full" style={{ background: roleColor.bar }}/>
                )}
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "")}/>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount && (
                      <span className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white",
                        item.liveCount ? "bg-amber-500" : "bg-red-500"
                      )}>
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badgeCount && (
                  <span className={cn(
                    "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    item.liveCount ? "bg-amber-500" : "bg-red-500"
                  )}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <button onClick={handleLogout} disabled={isLoggingOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-destructive-foreground disabled:opacity-50"
            )}
            title={collapsed ? "Déconnexion" : undefined}>
            <LogOut className="h-4 w-4 shrink-0"/>
            {!collapsed && <span>{isLoggingOut ? "Déconnexion…" : "Déconnexion"}</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE bottom nav ── */}
      {needsMore && moreOpen && (
        <>
          <div className="fixed inset-0 z-[9994] lg:hidden" onClick={() => setMoreOpen(false)}/>
          <div className="fixed bottom-16 left-0 right-0 z-[9995] lg:hidden px-3 pb-2">
            <div className="rounded-2xl border border-border/60 bg-background/98 shadow-2xl backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <span className={cn("text-xs font-bold uppercase tracking-wider", roleColor.text)}>{roleLabel}</span>
                <button onClick={() => setMoreOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:bg-secondary/60 transition-colors">
                  <X className="h-4 w-4"/>
                </button>
              </div>
              <div className="p-2">
                {moreItems.map((item) => {
                  const active = isActive(item.href)
                  const badgeCount = item.badge && item.badge > 0 ? item.badge : null
                  return (
                    <Link key={item.href} href={item.href}
                      className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                        active ? cn("border", roleColor.bg, roleColor.text) : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground")}>
                      <item.icon className={cn("h-5 w-5 shrink-0", active ? roleColor.text : "")}/>
                      <span className="flex-1">{item.label}</span>
                      {badgeCount && (
                        <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white",
                          item.liveCount ? "bg-amber-500" : "bg-red-500")}>
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
                <button onClick={handleLogout} disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/40 hover:bg-red-500/10 hover:text-red-400 transition-all mt-1 border-t border-border/30">
                  <LogOut className="h-5 w-5 shrink-0"/>
                  <span>{isLoggingOut ? "Déconnexion…" : "Déconnexion"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[9998] lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${roleColor.bar}55, transparent)` }}/>
        <div className="flex items-stretch bg-background/98 backdrop-blur-xl border-t border-border/50">
          {bottomItems.map((item) => {
            const active = isActive(item.href)
            const badgeCount = item.badge && item.badge > 0 ? item.badge : null
            return (
              <Link key={item.href} href={item.href}
                className={cn("relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all",
                  active ? roleColor.text : "text-foreground/45 hover:text-foreground/70")}>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: roleColor.bar }}/>}
                <div className="relative">
                  <item.icon className="h-5 w-5"/>
                  {badgeCount && (
                    <span className={cn("absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white leading-none",
                      item.liveCount ? "bg-amber-500" : "bg-red-500")}>
                      {badgeCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] leading-tight", active ? "font-semibold" : "font-medium")}>{item.label}</span>
              </Link>
            )
          })}
          {needsMore && (
            <button onClick={() => setMoreOpen(o => !o)}
              className={cn("relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all",
                moreOpen || moreActive ? roleColor.text : "text-foreground/45 hover:text-foreground/70")}>
              {(moreOpen || moreActive) && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: roleColor.bar }}/>}
              <MoreHorizontal className="h-5 w-5"/>
              <span className="text-[10px] font-medium leading-tight">Plus</span>
            </button>
          )}
          {!needsMore && (
            <button onClick={handleLogout} disabled={isLoggingOut}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 text-foreground/35 hover:text-red-400 transition-all disabled:opacity-50">
              <LogOut className="h-5 w-5"/>
              <span className="text-[10px] font-medium leading-tight">{isLoggingOut ? "…" : "Quitter"}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
