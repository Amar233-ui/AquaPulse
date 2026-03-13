"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, TrendingUp, Clock, Eye, X, MessageSquareWarning, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorAlert, OperatorIncident, IncidentSummary } from "@/lib/types"

interface AlertsResponse {
  summary: { critique: number; alerte: number; moyen: number; faible: number }
  items: OperatorAlert[]
}
interface IncidentsResponse {
  items: OperatorIncident[]
  summary: IncidentSummary
}

const DEFAULT_ALERTS: AlertsResponse = { summary: { critique: 0, alerte: 0, moyen: 0, faible: 0 }, items: [] }
const DEFAULT_INCIDENTS: IncidentsResponse = { items: [], summary: { nouveau: 0, enCours: 0, resolu: 0, total: 0 } }

const SEVERITY_CARDS = [
  { key: "critique", label: "Critiques",  activeClass: "border-l-destructive bg-destructive/5 ring-1 ring-destructive/30", inactiveClass: "border-l-destructive", dot: "bg-red-500"    },
  { key: "alerte",   label: "Alertes",    activeClass: "border-l-warning bg-warning/5 ring-1 ring-warning/30",             inactiveClass: "border-l-warning",     dot: "bg-amber-500"  },
  { key: "moyen",    label: "Moyennes",   activeClass: "border-l-chart-5 bg-chart-5/5 ring-1 ring-chart-5/30",             inactiveClass: "border-l-chart-5",     dot: "bg-purple-400" },
  { key: "faible",   label: "Faibles",    activeClass: "border-l-muted-foreground bg-muted/60 ring-1 ring-border",         inactiveClass: "border-l-muted-foreground", dot: "bg-slate-400" },
] as const

const STATUS_COLORS: Record<string, string> = {
  "Nouveau":  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "En cours": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "Résolu":   "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "Fermé":    "bg-slate-500/15 text-slate-400 border-slate-500/25",
}

const TYPE_LABELS: Record<string, string> = {
  fuite: "Fuite d'eau", qualite: "Qualité", pression: "Pression",
  coupure: "Coupure", odeur: "Odeur", autre: "Autre",
}

export default function AlertesPage() {
  const [activeTab, setActiveTab] = useState<"alertes" | "signalements">("alertes")

  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [classification, setClassification] = useState("all")

  const alertQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (severity !== "all") p.set("severity", severity)
    if (classification !== "all") p.set("classification", classification)
    const s = p.toString()
    return `/api/operateur/alertes${s ? `?${s}` : ""}`
  }, [search, severity, classification])

  const { data: alertData } = useApiQuery<AlertsResponse>(alertQuery, DEFAULT_ALERTS)

  const [sigSearch, setSigSearch] = useState("")
  const [sigStatus, setSigStatus] = useState("all")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const sigQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (sigSearch) p.set("search", sigSearch)
    if (sigStatus !== "all") p.set("status", sigStatus)
    const s = p.toString()
    return `/api/operateur/signalements${s ? `?${s}` : ""}`
  }, [sigSearch, sigStatus])

  const { data: sigData, refetch: refetchSig } = useApiQuery<IncidentsResponse>(sigQuery, DEFAULT_INCIDENTS)

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/operateur/signalements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      await refetchSig()
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <DashboardLayout role="operateur" title="Alertes & Signalements">
      <div className="space-y-6">

        {/* Onglets */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1 w-fit">
          <button
            onClick={() => setActiveTab("alertes")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "alertes"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Alertes système
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
              activeTab === "alertes" ? "bg-blue-500/20 text-blue-300" : "bg-secondary text-muted-foreground")}>
              {alertData.summary.critique + alertData.summary.alerte}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("signalements")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "signalements"
                ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <MessageSquareWarning className="h-4 w-4" />
            Signalements citoyens
            {sigData.summary.nouveau > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 animate-pulse">
                {sigData.summary.nouveau} nouveaux
              </span>
            )}
          </button>
        </div>

        {/* ══ TAB ALERTES ══ */}
        {activeTab === "alertes" && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              {SEVERITY_CARDS.map(card => {
                const active = severity === card.key
                return (
                  <button key={card.key} onClick={() => setSeverity(p => p === card.key ? "all" : card.key)}
                    className={cn("text-left rounded-lg border-l-4 border border-border/60 shadow-sm transition-all duration-150",
                      "hover:shadow-md hover:-translate-y-px active:translate-y-0",
                      active ? card.activeClass : card.inactiveClass)}>
                    <div className="p-4 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{alertData.summary[card.key]}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 mt-1">
                        <span className={cn("h-2 w-2 rounded-full", card.dot)} />
                        {active && <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-0.5">Actif</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

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
                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Liste des Alertes</CardTitle>
                  {alertData.items.length > 0 && <span className="text-xs text-muted-foreground">{alertData.items.length} résultat{alertData.items.length > 1 ? "s" : ""}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Localisation</TableHead>
                        <TableHead>Sévérité</TableHead>
                        <TableHead className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Probabilité</TableHead>
                        <TableHead><Clock className="inline h-3.5 w-3.5" /> Date</TableHead>
                        <TableHead>Statut</TableHead><TableHead className="sr-only">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertData.items.length === 0 ? (
                        <TableRow><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Aucune alerte pour ce filtre.</td></TableRow>
                      ) : alertData.items.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                          <TableCell className="font-medium">{alert.type}</TableCell>
                          <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                          <TableCell><StatusBadge status={alert.severity} /></TableCell>
                          <TableCell className="font-medium">{alert.probability}</TableCell>
                          <TableCell className="text-muted-foreground">{alert.date}</TableCell>
                          <TableCell className="text-sm">{alert.status}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ══ TAB SIGNALEMENTS ══ */}
        {activeTab === "signalements" && (
          <>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { label: "Total",    count: sigData.summary.total,   color: "text-foreground",  bg: "border-border/60" },
                { label: "Nouveaux", count: sigData.summary.nouveau,  color: "text-blue-400",    bg: "border-blue-500/30 bg-blue-500/5" },
                { label: "En cours", count: sigData.summary.enCours,  color: "text-orange-400",  bg: "border-orange-500/30 bg-orange-500/5" },
                { label: "Résolus",  count: sigData.summary.resolu,   color: "text-teal-400",    bg: "border-teal-500/30 bg-teal-500/5" },
              ].map(card => (
                <div key={card.label} className={cn("rounded-xl border p-4 shadow-sm", card.bg)}>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={cn("text-2xl font-bold tabular-nums mt-0.5", card.color)}>{card.count}</p>
                </div>
              ))}
            </div>

            <Card className="border border-border/60 shadow-sm">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="relative flex-1 min-w-40">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Rechercher un signalement..." className="pl-8" value={sigSearch} onChange={e => setSigSearch(e.target.value)} />
                </div>
                <Select value={sigStatus} onValueChange={setSigStatus}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Résolu">Résolu</SelectItem>
                    <SelectItem value="Fermé">Fermé</SelectItem>
                  </SelectContent>
                </Select>
                {(sigSearch || sigStatus !== "all") && (
                  <Button variant="outline" size="sm" onClick={() => { setSigSearch(""); setSigStatus("all") }} className="gap-1.5 text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Effacer
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4 text-orange-400" />
                  Signalements citoyens
                  <span className="text-xs font-normal text-muted-foreground ml-1">{sigData.items.length} résultat{sigData.items.length > 1 ? "s" : ""}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sigData.items.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                    <p className="font-semibold text-teal-300">Aucun signalement</p>
                    <p className="text-sm text-foreground/50 mt-1">Aucun signalement citoyen ne correspond à ce filtre.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sigData.items.map(incident => (
                      <div key={incident.id} className={cn("rounded-xl border p-4 transition-all",
                        incident.status === "Nouveau"   ? "border-blue-500/30 bg-blue-950/10"
                        : incident.status === "En cours" ? "border-orange-500/25 bg-orange-950/10"
                        : incident.status === "Résolu"   ? "border-teal-500/20 bg-teal-950/10"
                        : "border-border/40 bg-card/50")}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-foreground/40">#{incident.id}</span>
                              <span className="text-sm font-semibold text-foreground">{TYPE_LABELS[incident.type] ?? incident.type}</span>
                              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[incident.status] ?? "bg-muted text-muted-foreground")}>{incident.status}</span>
                            </div>
                            <p className="text-sm text-foreground/75">📍 {incident.location}</p>
                            <p className="text-xs text-foreground/55 line-clamp-2">{incident.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-foreground/40">
                              <span>🕐 {incident.createdAt}</span>
                              {incident.reporterName && <span>👤 {incident.reporterName}</span>}
                              {incident.reporterEmail && <span>✉️ {incident.reporterEmail}</span>}
                              {incident.resolvedAt && <span className="text-teal-400/70">✅ Résolu le {incident.resolvedAt}</span>}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:gap-1.5 sm:min-w-36 flex-shrink-0">
                            {updatingId === incident.id ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mise à jour…
                              </div>
                            ) : (
                              <>
                                {incident.status === "Nouveau" && (
                                  <button onClick={() => handleStatusUpdate(incident.id, "En cours")}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/25 transition-colors whitespace-nowrap">
                                    Prendre en charge →
                                  </button>
                                )}
                                {incident.status === "En cours" && (
                                  <button onClick={() => handleStatusUpdate(incident.id, "Résolu")}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-colors">
                                    Marquer résolu ✓
                                  </button>
                                )}
                                {(incident.status === "Résolu" || incident.status === "En cours") && (
                                  <button onClick={() => handleStatusUpdate(incident.id, "Fermé")}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/15 transition-colors">
                                    Fermer
                                  </button>
                                )}
                                {incident.status === "Fermé" && (
                                  <button onClick={() => handleStatusUpdate(incident.id, "Nouveau")}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                                    Réouvrir
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
