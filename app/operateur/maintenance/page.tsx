"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Wrench, Clock, CheckCircle2, AlertTriangle, Calendar,
  ChevronRight, X, Zap, MapPin, FileText, Gauge,
  PlayCircle, CheckCircle, Timer, Package
} from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useApiQuery } from "@/hooks/use-api-query"
import { useMarkNotificationsViewed } from "@/hooks/use-mark-notifications-viewed"

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkedAlert {
  id: string; type: string; location: string
  severity: string; description: string; probability: number; createdAt: string
}

interface MaintenanceTask {
  id: string; asset: string; type: string
  priority: "Haute" | "Moyenne" | "Basse"
  dueDate: string; confidence: number
  status: "Urgent" | "Planifie" | "En cours" | "Termine"
  source?: "ai" | "db"
  alertId: string | null
  assignedOperatorId?: number | null
  assignedOperatorName?: string | null
  assignedAt?: string | null
  linkedAlert: LinkedAlert | null
  eahFacilityId?: number | null
  linkedEah?: {
    id: number
    name: string
    type: string
    quartier: string
    address: string
    status: string
  } | null
  daysUntilDue: number
  isOverdue: boolean
  estimatedDuration: string
  requiredTools: string[]
  technicalNotes: string
}

interface MaintenanceResponse {
  stats: { pending: number; completedThisMonth: number; aiPredictions: number; avoidedCost: number }
  items: MaintenanceTask[]
  ai_available?: boolean
}

// Fallback detail enrichment côté client pour les tâches sans données enrichies
const TASK_DETAILS: Record<string, { duration: string; tools: string[]; notes: string }> = {
  "Remplacement joint": {
    duration: "4-6h",
    tools: ["Clé dynamométrique", "Joints neufs (DN80)", "Lubrifiant industriel", "Manomètre"],
    notes: "Couper l'alimentation eau amont avant intervention. Purger la pression résiduelle. Tester l'étanchéité à 6 bar après remplacement. Documenter dans GMAO.",
  },
  "Calibration": {
    duration: "2-3h",
    tools: ["Multimètre certifié", "Référence de calibration", "Câble de diagnostic USB", "Logiciel terrain"],
    notes: "Effectuer la calibration à température stabilisée (20°C ±2°C). Comparer avec capteur étalon. Consigner les valeurs avant/après dans le rapport.",
  },
  "Nettoyage": {
    duration: "1-2h",
    tools: ["Kit nettoyage capteur", "Solution désincrustante pH-neutre", "Brosse nylon souple", "EPI chimique"],
    notes: "Ne pas utiliser de produits chlorés sur les membranes. Rincer à l'eau distillée x3. Vérifier la stabilité du signal 15min après nettoyage.",
  },
  "Inspection": {
    duration: "3-5h",
    tools: ["Caméra endoscopique étanche", "Testeur d'étanchéité pneumatique", "Jauge d'épaisseur ultrasonique", "Formulaire inspection C-07"],
    notes: "Inspecter 50m de part et d'autre du point signalé. Photographier toute corrosion ou fissure. Mesurer l'épaisseur de paroi si corrosion visible (seuil critique : 3mm).",
  },
  "Remplacement filtre": {
    duration: "2h",
    tools: ["Filtre de remplacement (référence constructeur)", "Clé filtre 3/4\"", "Bac de récupération 20L", "Joint de filtre neuf"],
    notes: "Fermer les vannes amont/aval. Évacuer l'eau résiduelle. Vérifier la pression différentielle post-remplacement (max 0.3 bar). Planifier prochain remplacement à J+90.",
  },
}

function getTaskDetails(type: string) {
  return TASK_DETAILS[type] ?? {
    duration: "2-4h",
    tools: ["Outillage standard terrain", "EPI réglementaire", "Rapport d'intervention"],
    notes: "Appliquer la procédure standard en vigueur. Consigner toutes les observations dans le rapport d'intervention GMAO après opération.",
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const DEFAULT_DATA: MaintenanceResponse = {
  stats: { pending: 0, completedThisMonth: 0, aiPredictions: 0, avoidedCost: 0 },
  items: [],
  ai_available: false,
}

const PRIORITY_STYLES: Record<string, string> = {
  Haute:   "bg-red-500/15 text-red-400 border-red-500/30",
  Moyenne: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Basse:   "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const STATUS_STYLES: Record<string, string> = {
  Urgent:     "bg-red-500/15 text-red-400 border-red-500/30",
  "En cours": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Planifie:   "bg-slate-500/15 text-slate-400 border-slate-500/30",
  Termine:    "bg-green-500/15 text-green-400 border-green-500/30",
}

const SEVERITY_COLORS: Record<string, string> = {
  critique: "text-red-400",
  alerte:   "text-amber-400",
  moyen:    "text-purple-400",
  faible:   "text-slate-400",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  useMarkNotificationsViewed(["maintenance"])

  const [selected, setSelected] = useState<MaintenanceTask | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [refresh,  setRefresh]  = useState(0)

  const query = `/api/operateur/maintenance${refresh > 0 ? `?_r=${refresh}` : ""}`
  const { data, loading } = useApiQuery<MaintenanceResponse>(query, DEFAULT_DATA)

  useEffect(() => {
    if (!selected) return
    const updated = data.items.find((item) => item.id === selected.id)
    if (updated) {
      setSelected(updated)
    }
  }, [data.items, selected?.id])

  const updateStatus = useCallback(async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const res = await fetch("/api/operateur/maintenance", {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        setRefresh(r => r + 1)
        if (selected?.id === id) {
          setSelected(prev => prev ? { ...prev, status: newStatus as MaintenanceTask["status"] } : null)
        }
      }
    } finally {
      setUpdating(null)
    }
  }, [selected])

  return (
    <DashboardLayout role="operateur" title="Maintenance Prédictive">
      <div className="flex flex-col gap-4 lg:flex-row" style={{ minHeight: "calc(100vh - 9rem)" }}>

        {/* ── LISTE ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* KPIs */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {loading && data.items.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border border-border/60">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <KPICard title="En Attente" value={`${data.stats.pending}`} change="À planifier en priorité" changeType="negative" icon={Clock} />
                <KPICard title="Complétées" value={`${data.stats.completedThisMonth}`} change="Ce mois" changeType="positive" icon={CheckCircle2} />
                <KPICard
                  title={data.ai_available ? "Prédictions IA" : "Tâches scorées"}
                  value={`${data.stats.aiPredictions}`}
                  change={data.ai_available ? "Détectées automatiquement" : "Confiance issue des tâches enregistrées"}
                  changeType="neutral"
                  icon={AlertTriangle}
                  iconColor="bg-warning/15"
                />
                <KPICard title="Coût Évité" value={`${data.stats.avoidedCost.toLocaleString()} FCFA`} change="Estimation mensuelle" changeType="positive" icon={Wrench} />
              </>
            )}
          </div>

          <Card className={cn(
            "border shadow-sm",
            data.ai_available
              ? "border-blue-500/25 bg-blue-500/5"
              : "border-slate-500/25 bg-slate-500/5"
          )}>
            <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">État IA maintenance</p>
                <p className="text-sm text-foreground">
                  {data.ai_available
                    ? "Les priorités ci-dessous sont enrichies par le moteur IA."
                    : "Le moteur IA maintenance n'est pas branché sur cette vue pour le moment."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.ai_available
                    ? "Les scores et urgences reflètent les prédictions du microservice."
                    : "Les tâches affichées proviennent de la base locale; le score visible correspond aux données déjà enregistrées."}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "self-start text-[10px] sm:self-center",
                  data.ai_available
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                )}
              >
                {data.ai_available ? "IA active" : "Sans IA live"}
              </Badge>
            </CardContent>
          </Card>

          {/* Tableau tâches */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Plan de Maintenance Prédictive
                {data.items.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({data.items.length} tâches)</span>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 sm:w-auto">
                <Calendar className="h-3.5 w-3.5" /> Calendrier
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading && data.items.length === 0 && (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              )}
              {!loading && data.items.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucune tâche de maintenance planifiée.
                </div>
              )}
              <div className="divide-y divide-border/40">
                {data.items.map(task => {
                  const isSelected = selected?.id === task.id
                  const details    = getTaskDetails(task.type)
                  const dueMs      = task.dueDate ? new Date(task.dueDate).getTime() : 0
                  const daysUntil  = task.daysUntilDue ?? (dueMs ? Math.ceil((dueMs - Date.now()) / 86400000) : 0)
                  const isOverdue  = task.isOverdue ?? (daysUntil < 0 && task.status !== "Termine")

                  return (
                    <div key={task.id}
                      onClick={() => setSelected(isSelected ? null : task)}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30",
                        isSelected  ? "bg-primary/5 border-l-2 border-l-primary" : "",
                        isOverdue   ? "bg-red-500/3" : "",
                      )}>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
                          <Badge variant="outline" className={cn("text-[10px]", PRIORITY_STYLES[task.priority])}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[task.status ?? "Planifie"])}>
                            {task.status}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">
                              En retard
                            </Badge>
                          )}
                          {task.source === "ai" && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                              <Zap className="h-2.5 w-2.5" /> IA
                            </span>
                          )}
                          {task.source !== "ai" && task.alertId && (
                            <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                              <Wrench className="h-2.5 w-2.5" /> Liée à une alerte
                            </span>
                          )}
                          {task.linkedEah && (
                            <span className="flex items-center gap-0.5 text-[10px] text-cyan-400">
                              <MapPin className="h-2.5 w-2.5" /> Site EAH
                            </span>
                          )}
                          {task.assignedOperatorName && (
                            <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {task.assignedOperatorName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{task.asset}</p>
                        <p className="text-xs text-muted-foreground">{task.type}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:hidden">
                          <span>{task.confidence}% confiance</span>
                          <span>{task.dueDate}</span>
                          {daysUntil !== 0 && (
                            <span className={cn(
                              daysUntil < 0 ? "text-red-400" : daysUntil <= 3 ? "text-amber-400" : "text-muted-foreground",
                            )}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)}j retard` : `dans ${daysUntil}j`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-5 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Confiance IA</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Progress value={task.confidence} className="h-1.5 w-16" />
                            <span className="text-xs font-medium">{task.confidence}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Échéance</p>
                          <p className={cn("text-sm font-medium", isOverdue ? "text-red-400" : "text-foreground")}>
                            {task.dueDate}
                          </p>
                          {daysUntil !== 0 && (
                            <p className={cn("text-[10px]",
                              daysUntil < 0 ? "text-red-400" : daysUntil <= 3 ? "text-amber-400" : "text-muted-foreground")}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)}j retard` : `dans ${daysUntil}j`}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── PANNEAU DÉTAIL ── */}
        {selected && (() => {
          const details   = getTaskDetails(selected.type)
          const dueMs     = selected.dueDate ? new Date(selected.dueDate).getTime() : 0
          const daysUntil = selected.daysUntilDue ?? (dueMs ? Math.ceil((dueMs - Date.now()) / 86400000) : 0)
          const isOverdue = selected.isOverdue ?? (daysUntil < 0 && selected.status !== "Termine")

          return (
            <>
            <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSelected(null)} />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border/60 bg-background lg:static lg:z-auto lg:max-h-[calc(100vh-9rem)] lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:rounded-none lg:border-0 lg:bg-transparent">
              <Card className="border-0 shadow-none lg:border lg:border-border/60 lg:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", PRIORITY_STYLES[selected.priority])}>
                          {selected.priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[selected.status ?? "Planifie"])}>
                          {selected.status}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">
                            En retard
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground leading-tight">{selected.asset}</p>
                      <p className="text-xs text-muted-foreground">{selected.type}</p>
                      {selected.assignedOperatorName && (
                        <p className="text-[11px] text-blue-300">
                          Affectée à {selected.assignedOperatorName}
                          {selected.assignedAt ? ` • ${selected.assignedAt}` : ""}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      onClick={() => setSelected(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0 text-sm">

                  {/* Métriques */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <Gauge className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground">Confiance IA</p>
                      <p className="font-bold text-foreground text-sm mt-0.5">{selected.confidence}%</p>
                      <Progress value={selected.confidence} className="h-1 mt-1" />
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <Timer className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground">Durée estimée</p>
                      <p className="font-bold text-foreground text-xs mt-0.5 leading-tight">
                        {selected.estimatedDuration ?? details.duration}
                      </p>
                    </div>
                    <div className={cn("rounded-lg p-2.5 text-center", isOverdue ? "bg-red-500/10" : "bg-muted/30")}>
                      <Calendar className={cn("h-3.5 w-3.5 mx-auto mb-1", isOverdue ? "text-red-400" : "text-primary")} />
                      <p className="text-[10px] text-muted-foreground">Échéance</p>
                      <p className={cn("font-bold text-xs mt-0.5 leading-tight", isOverdue ? "text-red-400" : "text-foreground")}>
                        {selected.dueDate}
                      </p>
                    </div>
                  </div>

                  {/* Alerte IA déclencheuse */}
                  {(selected.linkedAlert || selected.alertId) && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <p className="text-xs font-bold text-amber-400">Alerte IA déclencheuse</p>
                        <span className="ml-auto font-mono text-[10px] text-amber-400/70">
                          {selected.linkedAlert?.id ?? selected.alertId}
                        </span>
                      </div>
                      {selected.linkedAlert && (
                        <>
                          <div className="grid grid-cols-1 gap-1 text-[10px] sm:grid-cols-2">
                            <div>
                              <span className="text-muted-foreground">Type : </span>
                              <span className="font-semibold text-foreground">{selected.linkedAlert.type}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sévérité : </span>
                              <span className={cn("font-semibold", SEVERITY_COLORS[selected.linkedAlert.severity] ?? "text-foreground")}>
                                {selected.linkedAlert.severity}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-1 text-[10px]">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{selected.linkedAlert.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-muted-foreground">Probabilité IA :</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${selected.linkedAlert.probability}%` }} />
                            </div>
                            <span className="font-bold text-amber-400">{selected.linkedAlert.probability}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selected.linkedEah && (
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <p className="text-xs font-bold text-cyan-400">Site EAH lié</p>
                        <span className="ml-auto font-mono text-[10px] text-cyan-400/70">
                          EAH-{selected.linkedEah.id}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{selected.linkedEah.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selected.linkedEah.quartier} · {selected.linkedEah.address}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                          {selected.linkedEah.type.replaceAll("_", " ")}
                        </span>
                        <span className="text-muted-foreground">Statut site: {selected.linkedEah.status}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes techniques */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes Techniques</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
                      <p className="text-xs leading-relaxed text-foreground/80">
                        {selected.technicalNotes ?? details.notes}
                      </p>
                    </div>
                  </div>

                  {/* Matériel requis */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Matériel Requis</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selected.requiredTools ?? details.tools).map((tool, i) => (
                        <span key={i}
                          className="text-[10px] bg-secondary/60 border border-border/40 rounded-md px-2 py-1 text-foreground/70">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions workflow */}
                  <div className="border-t border-border/40 pt-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</p>

                    {selected.status === "Termine" ? (
                      <div className="flex items-center justify-center gap-2 py-3 text-green-400 text-xs rounded-lg bg-green-500/5 border border-green-500/20">
                        <CheckCircle className="h-4 w-4" />
                        Tâche complétée avec succès
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(selected.status === "Planifie" || selected.status === "Urgent") && (
                          <Button size="sm"
                            className={cn(
                              "col-span-2 h-8 text-xs gap-1.5",
                              selected.status === "Urgent"
                                ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                                : "bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
                            )}
                            onClick={() => updateStatus(selected.id, "En cours")}
                            disabled={updating === selected.id}>
                            <PlayCircle className="h-3.5 w-3.5" />
                            {selected.status === "Urgent" ? "Intervention d'urgence" : "Démarrer l'intervention"}
                          </Button>
                        )}
                        {selected.status === "En cours" && (
                          <Button size="sm"
                            className="col-span-2 h-8 text-xs gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25"
                            onClick={() => updateStatus(selected.id, "Termine")}
                            disabled={updating === selected.id}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Marquer Terminée
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                          <FileText className="h-3.5 w-3.5" /> Rapport
                        </Button>
                        {selected.status !== "Urgent" && (
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
                            onClick={() => updateStatus(selected.id, "Urgent")}
                            disabled={updating === selected.id}>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Urgence
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>
            </>
          )
        })()}
      </div>
    </DashboardLayout>
  )
}
