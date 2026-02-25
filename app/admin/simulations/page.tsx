"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FlaskConical, Play, Eye, Download, Plus } from "lucide-react"

const simulations = [
  { id: "SIM-001", name: "Secheresse Estivale 2026", scenario: "Secheresse", status: "Termine", date: "2026-02-20", resultRisk: "Moyen", duration: "24h" },
  { id: "SIM-002", name: "Inondation Flash - Zone Sud", scenario: "Inondation", status: "Termine", date: "2026-02-18", resultRisk: "Eleve", duration: "48h" },
  { id: "SIM-003", name: "Contamination Reservoir A", scenario: "Contamination", status: "En cours", date: "2026-02-23", resultRisk: "-", duration: "12h" },
  { id: "SIM-004", name: "Panne Electrique Generale", scenario: "Panne", status: "Planifie", date: "2026-02-25", resultRisk: "-", duration: "6h" },
  { id: "SIM-005", name: "Pic de Demande Hivernal", scenario: "Surcharge", status: "Termine", date: "2026-02-15", resultRisk: "Faible", duration: "72h" },
]

const statusColors: Record<string, string> = {
  Termine: "bg-success/15 text-success border-success/20",
  "En cours": "bg-accent/15 text-accent border-accent/20",
  Planifie: "bg-secondary text-secondary-foreground border-border",
}

const riskColors: Record<string, string> = {
  Eleve: "bg-destructive/15 text-destructive border-destructive/20",
  Moyen: "bg-warning/15 text-warning-foreground border-warning/20",
  Faible: "bg-success/15 text-success border-success/20",
  "-": "bg-secondary text-muted-foreground border-border",
}

export default function SimulationsPage() {
  return (
    <DashboardLayout role="admin" title="Scenarios de Simulation">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
              <FlaskConical className="h-8 w-8 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Total Simulations</p>
                <p className="text-xl font-bold text-foreground">42</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
              <Play className="h-8 w-8 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">En Cours</p>
                <p className="text-xl font-bold text-foreground">1</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
              <Download className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Rapports Generes</p>
                <p className="text-xl font-bold text-foreground">38</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Historique des Simulations</CardTitle>
            <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-3.5 w-3.5" />
              Nouveau Scenario
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Duree</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Risque</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((sim) => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-mono text-xs">{sim.id}</TableCell>
                    <TableCell className="font-medium">{sim.name}</TableCell>
                    <TableCell className="text-muted-foreground">{sim.scenario}</TableCell>
                    <TableCell className="text-sm">{sim.duration}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[sim.status]}>
                        {sim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskColors[sim.resultRisk]}>
                        {sim.resultRisk}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sim.date}</TableCell>
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
