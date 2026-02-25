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

const users = [
  { id: 1, name: "Jean Dupont", email: "jean.dupont@aquapulse.io", role: "Administrateur", status: true, lastLogin: "Il y a 5 min", initials: "JD" },
  { id: 2, name: "Marie Laurent", email: "marie.laurent@aquapulse.io", role: "Operateur", status: true, lastLogin: "Il y a 1h", initials: "ML" },
  { id: 3, name: "Pierre Martin", email: "pierre.martin@aquapulse.io", role: "Operateur", status: true, lastLogin: "Il y a 3h", initials: "PM" },
  { id: 4, name: "Sophie Dubois", email: "sophie.dubois@aquapulse.io", role: "Technicien", status: true, lastLogin: "Il y a 6h", initials: "SD" },
  { id: 5, name: "Lucas Moreau", email: "lucas.moreau@aquapulse.io", role: "Operateur", status: false, lastLogin: "Il y a 2j", initials: "LM" },
  { id: 6, name: "Emma Bernard", email: "emma.bernard@aquapulse.io", role: "Analyste", status: true, lastLogin: "Il y a 30 min", initials: "EB" },
  { id: 7, name: "Hugo Petit", email: "hugo.petit@ville.fr", role: "Citoyen", status: true, lastLogin: "Il y a 1j", initials: "HP" },
  { id: 8, name: "Lea Roux", email: "lea.roux@ville.fr", role: "Citoyen", status: true, lastLogin: "Il y a 4h", initials: "LR" },
]

const roleColors: Record<string, string> = {
  Administrateur: "bg-primary/15 text-primary border-primary/20",
  Operateur: "bg-accent/15 text-accent border-accent/20",
  Technicien: "bg-warning/15 text-warning-foreground border-warning/20",
  Analyste: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  Citoyen: "bg-secondary text-secondary-foreground border-border",
}

export default function UtilisateursPage() {
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
                <p className="text-xl font-bold text-foreground">235</p>
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
                <p className="text-xl font-bold text-foreground">218</p>
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
                <p className="text-xl font-bold text-foreground">24</p>
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
                <p className="text-xl font-bold text-foreground">18</p>
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
                <Input placeholder="Rechercher..." className="pl-8" />
              </div>
              <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <UserPlus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                {users.map((user) => (
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
                      <Switch checked={user.status} />
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
