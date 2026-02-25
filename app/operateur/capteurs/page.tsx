"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Wifi, WifiOff, Battery, Signal } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const sensors = [
  { id: "SNR-001", type: "Debit", location: "Bd Haussmann - Noeud #247", status: "actif" as const, battery: 92, signal: 95, lastUpdate: "Il y a 2 min" },
  { id: "SNR-002", type: "Pression", location: "Station Est - Vanne #12", status: "actif" as const, battery: 87, signal: 88, lastUpdate: "Il y a 3 min" },
  { id: "SNR-003", type: "Qualite", location: "Reservoir Nord - Zone C", status: "alerte" as const, battery: 23, signal: 72, lastUpdate: "Il y a 15 min" },
  { id: "SNR-004", type: "Temperature", location: "Centre-Ville - Point #56", status: "actif" as const, battery: 95, signal: 98, lastUpdate: "Il y a 1 min" },
  { id: "SNR-005", type: "Debit", location: "Secteur 12 - Compteur #891", status: "actif" as const, battery: 78, signal: 91, lastUpdate: "Il y a 5 min" },
  { id: "SNR-006", type: "Pression", location: "Zone Industrielle - Vanne #45", status: "inactif" as const, battery: 0, signal: 0, lastUpdate: "Il y a 2h" },
  { id: "SNR-007", type: "Qualite", location: "Reservoir Sud - Zone A", status: "actif" as const, battery: 65, signal: 84, lastUpdate: "Il y a 4 min" },
  { id: "SNR-008", type: "Acoustique", location: "Rue de Rivoli - Joint #12", status: "actif" as const, battery: 81, signal: 90, lastUpdate: "Il y a 2 min" },
]

export default function CapteursPage() {
  return (
    <DashboardLayout role="operateur" title="Monitoring des Capteurs">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                <Wifi className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Ligne</p>
                <p className="text-2xl font-bold text-foreground">2,352</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
                <Battery className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batterie Faible</p>
                <p className="text-2xl font-bold text-foreground">38</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                <WifiOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hors Ligne</p>
                <p className="text-2xl font-bold text-foreground">10</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Liste des Capteurs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un capteur..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Batterie</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Derniere MAJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell className="font-mono text-xs">{sensor.id}</TableCell>
                    <TableCell className="font-medium">{sensor.type}</TableCell>
                    <TableCell className="text-muted-foreground">{sensor.location}</TableCell>
                    <TableCell><StatusBadge status={sensor.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={sensor.battery} className="h-1.5 w-16" />
                        <span className="text-xs">{sensor.battery}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{sensor.signal}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sensor.lastUpdate}</TableCell>
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
