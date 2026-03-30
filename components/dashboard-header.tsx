"use client"

import Link from "next/link"
import { Bell, Search, User, Sun, Moon, AlertTriangle, MessageSquareWarning, Wrench, Droplets } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { NotificationItem, UserRole } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"

interface AuthHeaderState {
  user: {
    id: number
    name: string
    email: string
    role: UserRole
  } | null
  notifications: number
}

interface NotificationsResponse {
  items: NotificationItem[]
  unread: number
}

const ROLE_LABEL: Record<UserRole, string> = {
  citoyen:   "Citoyen",
  operateur: "Opérateur",
  admin:     "Admin",
}

export function DashboardHeader({
  title,
  onMenuClick,
}: {
  title: string
  onMenuClick: () => void
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showSearch, setShowSearch] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [auth, setAuth] = useState<AuthHeaderState>({ user: null, notifications: 0 })
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAuth() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        if (!response.ok) return
        const json = (await response.json()) as AuthHeaderState
        if (!cancelled) setAuth(json)
      } catch {}
    }
    void loadAuth()
    const handleRefresh = () => { void loadAuth() }
    window.addEventListener("notifications:refresh", handleRefresh)
    return () => {
      cancelled = true
      window.removeEventListener("notifications:refresh", handleRefresh)
    }
  }, [])

  useEffect(() => {
    if (!notifOpen) {
      return
    }

    let cancelled = false

    async function loadNotifications() {
      setNotifLoading(true)
      try {
        const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" })
        if (!response.ok) return
        const json = (await response.json()) as NotificationsResponse
        if (cancelled) return
        setNotifItems(json.items)

        const categories = Array.from(new Set(json.items.map((item) => item.category)))
        if (categories.length > 0) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ categories }),
          })
          if (!cancelled) {
            setAuth((prev) => ({ ...prev, notifications: 0 }))
            window.dispatchEvent(new Event("notifications:refresh"))
          }
        }
      } catch {
      } finally {
        if (!cancelled) setNotifLoading(false)
      }
    }

    void loadNotifications()
    return () => { cancelled = true }
  }, [notifOpen])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/auth/login")
    router.refresh()
  }

  const isDark = theme === "dark"
  const categoryIcon = (category: NotificationItem["category"]) => {
    if (category === "signalements") return <MessageSquareWarning className="h-3.5 w-3.5 text-amber-400" />
    if (category === "maintenance") return <Wrench className="h-3.5 w-3.5 text-red-400" />
    if (category === "eah") return <Droplets className="h-3.5 w-3.5 text-cyan-300" />
    return <AlertTriangle className="h-3.5 w-3.5 text-blue-400" />
  }

  return (
    /* fixed tout en haut, z-[9999] pour rester au-dessus de tout (Leaflet, sidebar, etc.)
       Le hamburger mobile a été supprimé — la navigation est maintenant en bas */
    <header className="fixed top-0 left-0 right-0 z-[9999] flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        {/* Plus de bouton hamburger — bottom nav gère la navigation mobile */}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Recherche */}
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="h-9 w-40 pl-8 text-sm sm:w-48 lg:w-64"
              onBlur={() => setShowSearch(false)}
              autoFocus
            />
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Rechercher</span>
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {auth.notifications > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]">
                  {auth.notifications}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(92vw,24rem)] p-0">
            <div className="border-b border-border/40 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                Seulement les éléments non vus depuis la cloche ou les pages opérateur.
              </p>
            </div>
            <ScrollArea className="max-h-[24rem]">
              <div className="p-2">
                {notifLoading ? (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">Chargement…</div>
                ) : notifItems.length === 0 ? (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Rien de nouveau pour le moment.
                  </div>
                ) : (
                  notifItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setNotifOpen(false)}
                      className="flex gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                    >
                      <div className="mt-0.5 shrink-0">{categoryIcon(item.category)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-xs font-medium text-foreground">{item.title}</span>
                          <StatusBadge status={item.severity} className="h-5 px-1.5 text-[10px]" />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{item.time}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle dark / light */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {isDark
              ? <Sun className="h-5 w-5 text-amber-400" />
              : <Moon className="h-5 w-5 text-slate-500" />
            }
            <span className="sr-only">Changer le thème</span>
          </Button>
        )}

        {/* Profil */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="sr-only">Profil</span>
          </Button>
          <div className="hidden text-right lg:block">
            <p className="text-sm font-semibold text-foreground">{auth.user?.name ?? "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground">{auth.user ? ROLE_LABEL[auth.user.role] : ""}</p>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  )
}
