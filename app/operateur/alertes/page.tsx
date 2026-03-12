"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, TrendingUp, Clock, Eye, X } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

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

const SEVERITY_CARDS = [
  { key: "critique", label: "Critiques",  activeClass: "border-l-destructive bg-destructive/5 ring-1 ring-destructive/30", inactiveClass: "border-l-destructive", dot: "bg-red-500"    },
  { key: "alerte",   label: "Alertes",    activeClass: "border-l-warning bg-warning/5 ring-1 ring-warning/30",             inactiveClass: "border-l-warning",     dot: "bg-amber-500"  },
  { key: "moyen",    label: "Moyennes",   activeClass: "border-l-chart-5 bg-chart-5/5 ring-1 ring-chart-5/30",             inactiveClass: "border-l-chart-5",     dot: "bg-purple-400" },
  { key: "faible",   label: "Faibles",    activeClass: "border-l-muted-foreground bg-muted/60 ring-1 ring-border",          inactiveClass: "border-l-muted-foreground", dot: "bg-slate-400" },
] as const

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

  const handleCardClick = (key: string) => setSeverity(prev => prev === key ? "all" : key)

  return (
    <DashboardLayout role="operateur" title="Alertes & Anomalies">
      <div className="space-y-6">

        {/* Cards cliquables */}
        <div className="grid gap-4 sm:grid-cols-4">
          {SEVERITY_CARDS.map(card => {
            const active = severity === card.key
            return (
              <button
                key={card.key}
                onClick={() => handleCardClick(card.key)}
                className={cn(
                  "text-left rounded-lg border-l-4 border border-border/60 shadow-sm transition-all duration-150",
                  "hover:shadow-md hover:-translate-y-px active:translate-y-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? card.activeClass : card.inactiveClass
                )}
              >
                <div className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{data.summary[card.key]}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 mt-1">
                    <span className={cn("h-2 w-2 rounded-full", card.dot)} />
                    {active && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                        Actif
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Filtres */}
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher une alerte..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sévérité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="alerte">Alerte</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Classification" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Fuite">Fuite</SelectItem>
                <SelectItem value="Panne pompe">Panne Pompe</SelectItem>
                <SelectItem value="Fraude">Fraude</SelectItem>
                <SelectItem value="Contamination">Contamination</SelectItem>
              </SelectContent>
            </Select>
            {(severity !== "all" || classification !== "all" || search) && (
              <Button variant="outline" size="sm" onClick={() => { setSeverity("all"); setClassification("all"); setSearch("") }} className="gap-1.5 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Effacer
              </Button>
            )}
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /><span className="sr-only">Filtrer</span></Button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Liste des Alertes</CardTitle>
              {data.items.length > 0 && (
                <span className="text-xs text-muted-foreground">{data.items.length} résultat{data.items.length > 1 ? "s" : ""}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Probabilité</TableHead>
                    <TableHead><Clock className="inline h-3.5 w-3.5" /> Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        Aucune alerte pour ce filtre.
                      </td>
                    </TableRow>
                  ) : data.items.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                      <TableCell className="font-medium">{alert.type}</TableCell>
                      <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                      <TableCell><StatusBadge status={alert.severity} /></TableCell>
                      <TableCell className="font-medium">{alert.probability}</TableCell>
                      <TableCell className="text-muted-foreground">{alert.date}</TableCell>
                      <TableCell className="text-sm">{alert.status}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /><span className="sr-only">Voir</span></Button>
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
