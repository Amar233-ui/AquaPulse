"use client"

import { Bell, Search, User, Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function DashboardHeader({ title }: { title: string }) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="h-9 w-48 pl-8 text-sm lg:w-64"
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

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="sr-only">Profil</span>
        </Button>
      </div>
    </header>
  )
}
