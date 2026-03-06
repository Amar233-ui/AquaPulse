"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, TrendingUp, Clock, Eye } from "lucide-react"
import { useMemo, useState } from "react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorAlert } from "@/lib/types"

interface AlertsResponse {
  summary: { critique: number; alerte: number; moyen: number; faible: number }
  items: OperatorAlert[]
}

const DEFAULT_ALERTS: AlertsResponse = {
  summary: { critique: 0, alerte: 0, moyen: 0, faible: 0 },
  items: [],
}

export default function AlertesPage() {
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [classification, setClassification] = useState("all")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (severity !== "all") params.set("severity", severity)
    if (classification !== "all") params.set("classification", classification)
    const suffix = params.toString()
    return `/api/operateur/alertes${suffix ? `?${suffix}` : ""}`
  }, [search, severity, classification])

  const { data } = useApiQuery<AlertsResponse>(query, DEFAULT_ALERTS)

  return (
    <DashboardLayout role="operateur" title="Alertes & Anomalies">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border-l-4 border-l-destructive border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-foreground">{data.summary.critique}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Alertes</p>
              <p className="text-2xl font-bold text-foreground">{data.summary.alerte}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-5 border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Moyennes</p>
              <p className="text-2xl font-bold text-foreground">{data.summary.moyen}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-muted-foreground border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Faibles</p>
              <p className="text-2xl font-bold text-foreground">{data.summary.faible}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une alerte..."
                className="pl-8"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
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
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Fuite">Fuite</SelectItem>
                <SelectItem value="Panne pompe">Panne Pompe</SelectItem>
                <SelectItem value="Fraude">Fraude</SelectItem>
                <SelectItem value="Contamination">Contamination</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>
          </CardContent>
        </Card>

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
                {data.items.map((alert) => (
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
