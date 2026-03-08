"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, UserPlus, MoreHorizontal, Shield, User, Eye } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useMemo, useState } from "react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { AdminUserItem } from "@/lib/types"

interface UsersResponse {
  stats: {
    total: number
    active: number
    operators: number
    new30d: number
  }
  items: AdminUserItem[]
}

const DEFAULT_DATA: UsersResponse = {
  stats: {
    total: 0,
    active: 0,
    operators: 0,
    new30d: 0,
  },
  items: [],
}

const roleColors: Record<string, string> = {
  Administrateur: "bg-primary/15 text-primary border-primary/20",
  Operateur: "bg-accent/15 text-accent border-accent/20",
  Citoyen: "bg-secondary text-secondary-foreground border-border",
}

export default function UtilisateursPage() {
  const [search, setSearch] = useState("")
  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const suffix = params.toString()
    return `/api/admin/utilisateurs${suffix ? `?${suffix}` : ""}`
  }, [search])

  const { data, setData } = useApiQuery<UsersResponse>(query, DEFAULT_DATA)

  async function handleStatusChange(userId: number, status: boolean) {
    setData((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === userId ? { ...item, status } : item)),
    }))

    await fetch("/api/admin/utilisateurs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: userId, status }),
    })
  }

  return (
    <DashboardLayout role="admin" title="Gestion des Utilisateurs">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{data.stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Eye className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold text-foreground">{data.stats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operateurs</p>
                <p className="text-xl font-bold text-foreground">{data.stats.operators}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <UserPlus className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nouveaux (30j)</p>
                <p className="text-xl font-bold text-foreground">{data.stats.new30d}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Utilisateurs</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <UserPlus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Derniere Connexion</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role]}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={user.status} onCheckedChange={(checked) => handleStatusChange(user.id, checked)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
