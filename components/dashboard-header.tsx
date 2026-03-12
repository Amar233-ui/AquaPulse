"use client"

import { Bell, Search, User, Sun, Moon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { UserRole } from "@/lib/types"

interface AuthHeaderState {
  user: {
    id: number
    name: string
    email: string
    role: UserRole
  } | null
  notifications: number
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
    return () => { cancelled = true }
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/auth/login")
    router.refresh()
  }

  const isDark = theme === "dark"

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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {auth.notifications > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
              {auth.notifications}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

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
