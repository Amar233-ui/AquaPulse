"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, TrendingUp, Clock, Eye } from "lucide-react"

const alerts = [
  { id: "ALT-001", type: "Fuite", classification: "Fuite", location: "Bd Haussmann - Noeud #247", severity: "critique" as const, probability: "94%", date: "2026-02-23 10:45", status: "En cours" },
  { id: "ALT-002", type: "Panne pompe", classification: "Panne pompe", location: "Station Est - Pompe #3", severity: "critique" as const, probability: "91%", date: "2026-02-23 10:12", status: "En cours" },
  { id: "ALT-003", type: "Contamination", classification: "Contamination", location: "Reservoir Nord - Zone C", severity: "alerte" as const, probability: "87%", date: "2026-02-23 09:30", status: "Analyse" },
  { id: "ALT-004", type: "Fraude", classification: "Fraude", location: "Secteur 12 - Compteur #891", severity: "alerte" as const, probability: "72%", date: "2026-02-23 09:00", status: "Investigation" },
  { id: "ALT-005", type: "Fuite", classification: "Fuite", location: "Rue de Rivoli - Joint #12", severity: "moyen" as const, probability: "65%", date: "2026-02-23 08:15", status: "Planifie" },
  { id: "ALT-006", type: "Pression", classification: "Panne pompe", location: "Zone Industrielle - Vanne #45", severity: "moyen" as const, probability: "58%", date: "2026-02-23 07:45", status: "Planifie" },
  { id: "ALT-007", type: "Debit anormal", classification: "Fuite", location: "Secteur 5 - Canalisation C12", severity: "faible" as const, probability: "45%", date: "2026-02-22 22:30", status: "Surveillance" },
  { id: "ALT-008", type: "Temperature", classification: "Contamination", location: "Reservoir Sud - Zone A", severity: "faible" as const, probability: "38%", date: "2026-02-22 20:00", status: "Surveillance" },
]

export default function AlertesPage() {
  return (
    <DashboardLayout role="operateur" title="Alertes & Anomalies">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border-l-4 border-l-destructive border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Alertes</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-5 border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Moyennes</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-muted-foreground border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Faibles</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher une alerte..." className="pl-8" />
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="alerte">Alerte</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="fuite">Fuite</SelectItem>
                <SelectItem value="panne">Panne Pompe</SelectItem>
                <SelectItem value="fraude">Fraude</SelectItem>
                <SelectItem value="contamination">Contamination</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Liste des Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Severite</TableHead>
                  <TableHead className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Probabilite</TableHead>
                  <TableHead><Clock className="inline h-3.5 w-3.5" /> Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                    <TableCell><StatusBadge status={alert.severity} /></TableCell>
                    <TableCell className="font-medium">{alert.probability}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.date}</TableCell>
                    <TableCell className="text-sm">{alert.status}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir</span>
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
