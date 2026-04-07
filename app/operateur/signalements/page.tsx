"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquareWarning, Search, Clock, CheckCircle2, XCircle,
  AlertTriangle, User, MapPin, Calendar, RefreshCw, Zap,
  ChevronRight, Inbox, Mail, ArrowRight, Loader2, Link2, Info,
  CheckCircle, RotateCcw
} from "lucide-react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useApiQuery } from "@/hooks/use-api-query"
import { useMarkNotificationsViewed } from "@/hooks/use-mark-notifications-viewed"
import type { OperatorIncident, IncidentSummary, BadgeCode } from "@/lib/types"

// ── Badges citoyens (référence côté client) ────────────────────────────────────
const BADGES_CLIENT: Record<BadgeCode, { icon: string; color: string; label: string }> = {
  premier_pas: { icon: "🌱", color: "#22c55e", label: "Premier Pas"  },
  vigilant:    { icon: "👁️",  color: "#3b82f6", label: "Vigilant"    },
  expert:      { icon: "🎯",  color: "#8b5cf6", label: "Expert"      },
  champion:    { icon: "🏆",  color: "#f59e0b", label: "Champion"    },
  sentinelle:  { icon: "🛡️",  color: "#06b6d4", label: "Sentinelle" },
  ambassadeur: { icon: "🌟",  color: "#ec4899", label: "Ambassadeur"},
}

// Cache local des profils points par userId (pour ne pas refetcher à chaque render)
const pointsCache = new Map<number, { points: number; badges: BadgeCode[] }>()

function useCitizenBadges(userId: number | null) {
  const [data, setData] = useState<{ points: number; badges: BadgeCode[] } | null>(null)
  useEffect(() => {
    if (!userId) { setData(null); return }
    if (pointsCache.has(userId)) { setData(pointsCache.get(userId)!); return }
    // Appel API minimal – on réutilise le profil global classement
    fetch(`/api/operateur/classement`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        for (const c of d.citizens ?? []) {
          pointsCache.set(c.userId, { points: c.totalPoints, badges: c.badges })
        }
        setData(pointsCache.get(userId) ?? { points: 0, badges: [] })
      })
      .catch(() => {})
  }, [userId])
  return data
}

function CitizenBadgesPill({ userId }: { userId: number | null }) {
  const data = useCitizenBadges(userId)
  if (!userId || !data || data.badges.length === 0) return null
  const top = data.badges.slice(-3)
  return (
    <span className="inline-flex items-center gap-1 text-[10px] rounded-full border border-teal-500/25 bg-teal-500/8 px-2 py-0.5">
      <span className="text-teal-400 font-semibold">{data.points}pts</span>
      {top.map(b => <span key={b} title={BADGES_CLIENT[b]?.label ?? b}>{BADGES_CLIENT[b]?.icon ?? "🏅"}</span>)}
    </span>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SignalementsResponse {
  items:   OperatorIncident[]
  summary: IncidentSummary
}

interface Correlation {
  alertId:    string
  alertType:  string
  location:   string
  severity:   string
  confidence: number
  reasons:    string[]
  status:     string
  date:       string
  source:     "ai" | "db"
}

interface CorrelateResponse {
  incidentId:     number
  correlations:   Correlation[]
  hasCorrelation: boolean
  analyzed:       number
  mode?:          "network" | "eah"
  message?:       string
}

interface EahFacilitySummary {
  id: number
  name: string
  type: string
  quartier: string
  address: string
  status: "operationnel" | "degradé" | "hors_service"
  notes: string | null
  school_nearby: boolean
  gender_accessible: boolean
}

const EMPTY: SignalementsResponse = {
  items:   [],
  summary: { nouveau: 0, enCours: 0, resolu: 0, total: 0 },
}

// Tous les statuts possibles (y compris "Analyse" de la DB seed)
const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  "Nouveau":  { color: "bg-red-500/15 text-red-400 border-red-500/30",      dot: "bg-red-400",    label: "Nouveau"  },
  "En cours": { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400",  label: "En cours" },
  "Analyse":  { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400",  label: "Analyse"  },
  "Résolu":   { color: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400",  label: "Résolu"   },
  "Fermé":    { color: "bg-slate-500/15 text-slate-400 border-slate-500/30", dot: "bg-slate-400",  label: "Fermé"    },
}

const TYPE_ICONS: Record<string, string> = {
  fuite: "💧", qualite: "🧪", pression: "⚡", coupure: "🚫",
  odeur: "👃", contamination: "⚠️", autre: "📋",
}

const TYPE_LABELS: Record<string, string> = {
  fuite: "Fuite d'eau", qualite: "Qualité", pression: "Pression basse",
  coupure: "Coupure d'eau", odeur: "Odeur suspecte",
  contamination: "Contamination", autre: "Autre problème",
}

const SEVERITY_COLORS: Record<string, string> = {
  critique: "text-red-400 bg-red-500/10 border-red-500/30",
  alerte:   "text-amber-400 bg-amber-500/10 border-amber-500/30",
  moyen:    "text-purple-400 bg-purple-500/10 border-purple-500/30",
  faible:   "text-slate-400 bg-slate-500/10 border-slate-500/30",
}

function timeAgo(dateStr: string): string {
  try {
    const d    = new Date(dateStr)
    const diff = (Date.now() - d.getTime()) / 1000
    if (isNaN(diff)) return dateStr
    if (diff < 60)    return "à l'instant"
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
    return dateStr
  } catch { return dateStr }
}

function inferQuartier(location: string): string | null {
  const knownQuartiers = [
    "Plateau",
    "Médina",
    "Fann",
    "HLM",
    "Grand Dakar",
    "Parcelles Assainies",
    "Pikine",
    "Guédiawaye",
  ]

  const normalized = location.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const match = knownQuartiers.find((quartier) =>
    normalized.includes(quartier.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()),
  )
  return match ?? null
}

// ── Hook corrélation IA ───────────────────────────────────────────────────────

function useCorrelation(incident: OperatorIncident | null) {
  const [result,  setResult]  = useState<CorrelateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!incident) { setResult(null); return }

    // Annuler la requête précédente
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setResult(null)

    fetch("/api/operateur/correlate", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      signal:      ctrl.signal,
      body:        JSON.stringify({
        id:          incident.id,
        type:        incident.type,
        location:    incident.location,
        description: incident.description,
        createdAt:   incident.createdAt,
        eahFacilityId: incident.eahFacilityId ?? null,
        eahFacilityName: incident.eahFacilityName ?? null,
      }),
    })
      .then(r => r.ok ? r.json() as Promise<CorrelateResponse> : null)
      .then(data => { if (!ctrl.signal.aborted) setResult(data) })
      .catch(() => { if (!ctrl.signal.aborted) setResult(null) })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })

    return () => { ctrl.abort() }
  }, [incident?.id])

  return { result, loading }
}

function useEahContext(incident: OperatorIncident | null) {
  const [items, setItems] = useState<EahFacilitySummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const quartier = incident ? inferQuartier(incident.location) : null
    if (!incident || !quartier) {
      setItems([])
      return
    }

    const ctrl = new AbortController()
    setLoading(true)

    fetch(`/api/operateur/eah?quartier=${encodeURIComponent(quartier)}`, {
      credentials: "include",
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ctrl.signal.aborted) {
          setItems(((data?.items ?? []) as EahFacilitySummary[]).filter((item) => item.status !== "operationnel"))
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setItems([])
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })

    return () => ctrl.abort()
  }, [incident?.id, incident?.location])

  return { items, loading, quartier: incident ? inferQuartier(incident.location) : null }
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function SignalementsPage() {
  useMarkNotificationsViewed(["signalements"])

  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("all")
  const [selected, setSelected] = useState<OperatorIncident | null>(null)
  const [refresh,  setRefresh]  = useState(0)

  // Optimistic update: mettre à jour le statut localement immédiatement
  const [localUpdates, setLocalUpdates] = useState<Record<number, string>>({})
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (search)           p.set("search", search)
    if (status !== "all") p.set("status", status)
    if (refresh > 0)      p.set("_r", String(refresh))
    const s = p.toString()
    return `/api/operateur/signalements${s ? `?${s}` : ""}`
  }, [search, status, refresh])

  const { data, loading } = useApiQuery<SignalementsResponse>(query, EMPTY)

  // Fusionner les mises à jour optimistes avec les données du serveur
  const items = useMemo(() => data.items.map(inc => ({
    ...inc,
    status: (localUpdates[inc.id] ?? inc.status) as OperatorIncident["status"],
  })), [data.items, localUpdates])

  // Mettre à jour selected si ses données ont changé
  useEffect(() => {
    if (!selected) return
    const updated = items.find(i => i.id === selected.id)
    if (updated && updated.status !== selected.status) {
      setSelected(updated)
    }
  }, [items, selected?.id])

  const { result: corrResult, loading: corrLoading } = useCorrelation(selected)
  const { items: eahContext, loading: eahLoading, quartier: incidentQuartier } = useEahContext(selected)

  const updateStatus = useCallback(async (id: number, newStatus: string) => {
    const prev = localUpdates[id] ?? data.items.find(i => i.id === id)?.status ?? "Nouveau"
    setUpdating(id)
    setUpdateError(null)

    // Mise à jour optimiste immédiate
    setLocalUpdates(u => ({ ...u, [id]: newStatus }))
    if (selected?.id === id) {
      setSelected(s => s ? { ...s, status: newStatus as OperatorIncident["status"] } : null)
    }

    try {
      const res = await fetch(`/api/operateur/signalements/${id}`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `Erreur ${res.status}`)
      }

      // Rafraîchir les données depuis le serveur après succès
      setRefresh(r => r + 1)
      // Nettoyer les mises à jour optimistes pour cet incident
      setLocalUpdates(u => { const n = { ...u }; delete n[id]; return n })

    } catch (err) {
      // Rollback en cas d'erreur
      setLocalUpdates(u => ({ ...u, [id]: prev }))
      if (selected?.id === id) {
        setSelected(s => s ? { ...s, status: prev as OperatorIncident["status"] } : null)
      }
      setUpdateError(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
      setTimeout(() => setUpdateError(null), 4000)
    } finally {
      setUpdating(null)
    }
  }, [selected, localUpdates, data.items])

  const nouveaux = items.filter(i => i.status === "Nouveau")
  const isActive = (s: string) => s === "Nouveau" || s === "En cours" || s === "Analyse"

  return (
    <DashboardLayout role="operateur" title="Signalements Citoyens">
      <div className="flex h-full flex-col gap-4 lg:flex-row" style={{ minHeight: "calc(100vh - 9rem)" }}>

        {/* ── LISTE ── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {loading && data.items.length === 0 ? (
              Array.from({length:4}).map((_,i) => (
                <Card key={i} className="border border-border/60">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <Skeleton className="h-3 w-20"/><Skeleton className="h-7 w-12"/>
                  </CardContent>
                </Card>
              ))
            ) : (
              [
                { label: "Nouveaux", value: data.summary.nouveau, color: "border-l-red-500",    icon: Inbox,               urgent: true  },
                { label: "En cours", value: data.summary.enCours, color: "border-l-amber-500",  icon: Clock,               urgent: false },
                { label: "Résolus",  value: data.summary.resolu,  color: "border-l-green-500",  icon: CheckCircle2,        urgent: false },
                { label: "Total",    value: data.summary.total,   color: "border-l-slate-500",  icon: MessageSquareWarning, urgent: false },
              ].map(k => (
                <Card key={k.label} className={`border-l-4 ${k.color} border-border/60 shadow-sm`}>
                  <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.urgent ? "bg-red-500/10" : "bg-muted/40"}`}>
                      <k.icon className={`h-4 w-4 ${k.urgent ? "text-red-400" : "text-muted-foreground"}`}/>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", k.urgent && k.value > 0 ? "text-red-400" : "text-foreground")}>
                        {k.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Erreur de mise à jour */}
          {updateError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-400 flex items-center gap-2 shrink-0">
              <AlertTriangle className="h-4 w-4 shrink-0"/>
              {updateError}
            </div>
          )}

          {/* Filtres */}
          <Card className="border border-border/60 shrink-0">
            <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full flex-1 sm:min-w-40">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <Input placeholder="Rechercher par type, lieu, nom…" className="pl-8 h-9"
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Statut"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Nouveau">Nouveau</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Résolu">Résolu</SelectItem>
                  <SelectItem value="Fermé">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 w-full gap-1.5 sm:w-auto"
                onClick={() => setRefresh(r => r + 1)} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")}/>
                Actualiser
              </Button>
            </CardContent>
          </Card>

          {/* Nouveaux urgents */}
          {nouveaux.length > 0 && (
            <Card className="border border-red-500/30 bg-red-500/5 shrink-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"/>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400"/>
                  </span>
                  {nouveaux.length} signalement{nouveaux.length > 1 ? "s" : ""} non traité{nouveaux.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {nouveaux.slice(0, 3).map(inc => (
                  <div key={inc.id} onClick={() => setSelected(inc)}
                    className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-card p-3 cursor-pointer hover:bg-red-500/5 transition-colors sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{TYPE_ICONS[inc.type.toLowerCase()] ?? "📋"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {TYPE_LABELS[inc.type.toLowerCase()] ?? inc.type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate sm:max-w-48">
                          {inc.location} · {timeAgo(inc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm"
                        className="h-8 flex-1 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 sm:h-7 sm:flex-none"
                        onClick={e => { e.stopPropagation(); updateStatus(inc.id, "En cours") }}
                        disabled={updating === inc.id}>
                        {updating === inc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                          : "Prendre en charge"
                        }
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                    </div>
                  </div>
                ))}
                {nouveaux.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{nouveaux.length - 3} autres signalements non traités
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Liste complète */}
          <Card className="border border-border/60 shadow-sm flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">
                Tous les signalements
                <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && items.length === 0 ? (
                <div className="divide-y divide-border/40">
                  {Array.from({length:4}).map((_,i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0"/>
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48"/><Skeleton className="h-3 w-32"/>
                      </div>
                      <Skeleton className="h-5 w-20 hidden sm:block"/>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquareWarning className="h-10 w-10 mb-3 opacity-30"/>
                  <p className="text-sm font-medium">Aucun signalement</p>
                  <p className="text-xs mt-1 opacity-70">
                    {search || status !== "all" ? "Aucun résultat pour ce filtre" : "Les citoyens n'ont pas encore signalé de problème"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {items.map(inc => {
                    const sc         = STATUS_CONFIG[inc.status] ?? STATUS_CONFIG["Nouveau"]
                    const isSelected = selected?.id === inc.id
                    const isPending  = updating === inc.id
                    return (
                      <div key={inc.id} onClick={() => setSelected(isSelected ? null : inc)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30",
                          isSelected  ? "bg-primary/5 border-l-2 border-l-primary" : "",
                          isPending   ? "opacity-60" : "",
                        )}>
                        <span className="text-xl shrink-0">{TYPE_ICONS[inc.type.toLowerCase()] ?? "📋"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              #{inc.id} — {TYPE_LABELS[inc.type.toLowerCase()] ?? inc.type}
                            </span>
                          {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground"/>}
                          {inc.eahFacilityName && (
                            <span className="text-[10px] rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                              Assainissement · {inc.eahFacilityName}
                            </span>
                          )}
                          {inc.assignedOperatorName && (
                            <span className="text-[10px] rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-blue-300">
                              Assigné · {inc.assignedOperatorName}
                            </span>
                          )}
                        </div>
                          <p className="text-xs text-muted-foreground truncate">{inc.location}</p>
                          {inc.reporterName && (
                            <p className="text-xs text-muted-foreground/60 truncate flex items-center gap-2">
                              Par : {inc.reporterName}
                              {inc.reporterUserId && <CitizenBadgesPill userId={inc.reporterUserId} />}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:hidden">
                            <span>{timeAgo(inc.createdAt)}</span>
                            <Badge variant="outline" className={`text-[10px] ${sc.color}`}>
                              <span className={`mr-1 h-1.5 w-1.5 rounded-full ${sc.dot} inline-block`}/>
                              {sc.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{timeAgo(inc.createdAt)}</span>
                          <Badge variant="outline" className={`text-[10px] ${sc.color}`}>
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${sc.dot} inline-block`}/>
                            {sc.label}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0"/>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── PANNEAU DÉTAIL ── */}
        {selected && (
          <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSelected(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border/60 bg-background lg:static lg:z-auto lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:rounded-none lg:border-0 lg:bg-transparent"
            style={{ maxHeight: "calc(100vh - 9rem)" }}>
            <Card className="border-0 shadow-none lg:border lg:border-border/60 lg:shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{TYPE_ICONS[selected.type.toLowerCase()] ?? "📋"}</span>
                      <CardTitle className="text-sm font-semibold">Signalement #{selected.id}</CardTitle>
                    </div>
                    <Badge variant="outline"
                      className={`text-[10px] ${STATUS_CONFIG[selected.status]?.color ?? ""}`}>
                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot ?? ""} inline-block`}/>
                      {STATUS_CONFIG[selected.status]?.label ?? selected.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                    onClick={() => setSelected(null)}>
                    <XCircle className="h-4 w-4"/>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm pt-0">
                {/* Infos principales */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                    <span className="font-medium">
                      {TYPE_LABELS[selected.type.toLowerCase()] ?? selected.type}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"/>
                    <span className="text-muted-foreground text-xs leading-relaxed">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(selected.createdAt)} — {selected.createdAt}
                    </span>
                  </div>
                  {selected.resolvedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0"/>
                      <span className="text-xs text-green-400">Résolu le {selected.resolvedAt}</span>
                    </div>
                  )}
                  {selected.assignedOperatorName && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0"/>
                      <span className="text-xs text-blue-300">
                        Pris en charge par {selected.assignedOperatorName}
                        {selected.assignedAt ? ` • ${selected.assignedAt}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                  <p className="text-xs leading-relaxed text-foreground/80">{selected.description}</p>
                </div>

                {selected.eahFacilityName && (
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Installation liée</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{selected.eahFacilityName}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Ce signalement contribue à la confirmation communautaire de cette installation.
                    </p>
                  </div>
                )}

                {/* Signalant */}
                {(selected.reporterName || selected.reporterEmail) && (
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Signalé par
                    </p>
                    {selected.reporterName && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-3.5 w-3.5 text-muted-foreground"/>
                        <span className="text-xs">{selected.reporterName}</span>
                        {selected.reporterUserId && <CitizenBadgesPill userId={selected.reporterUserId} />}
                      </div>
                    )}
                    {selected.reporterEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground"/>
                        <a href={`mailto:${selected.reporterEmail}`}
                          className="text-xs text-primary hover:underline truncate">
                          {selected.reporterEmail}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Corrélation IA */}
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400"/>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                      Corrélation IA
                    </p>
                    {corrLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto"/>}
                  </div>

                  {corrLoading && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Analyse du réseau…</p>
                    </div>
                  )}

                  {!corrLoading && corrResult?.hasCorrelation && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground">
                        {corrResult.correlations.length} correspondance{corrResult.correlations.length > 1 ? "s" : ""} sur {corrResult.analyzed} alertes analysées
                      </p>
                      {corrResult.correlations.map((corr, i) => (
                        <div key={i}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Link2 className="h-3 w-3 text-amber-400 shrink-0"/>
                                <span className="text-xs font-semibold text-amber-400">{corr.alertType}</span>
                                {corr.source === "ai" && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded">IA</span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{corr.location}</p>
                            </div>
                            <Badge variant="outline"
                              className={`text-[10px] shrink-0 ${SEVERITY_COLORS[corr.severity] ?? ""}`}>
                              {corr.severity}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Confiance</span>
                              <span className="font-bold text-amber-400">{corr.confidence}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${corr.confidence}%` }}/>
                            </div>
                          </div>
                          {corr.reasons.length > 0 && (
                            <div className="space-y-0.5">
                              {corr.reasons.map((r, j) => (
                                <p key={j} className="text-[10px] text-muted-foreground flex items-start gap-1">
                                  <span className="text-amber-400 shrink-0">·</span> {r}
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-amber-500/20 pt-1.5">
                            <span className="font-mono">{corr.alertId}</span>
                            <span>{corr.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!corrLoading && corrResult && !corrResult.hasCorrelation && (
                    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"/>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {corrResult.mode === "eah"
                          ? (corrResult.message ?? "Signalement assainissement : corrélation réseau non applicable.")
                          : "Aucune alerte réseau correspondante."}
                        {corrResult.mode !== "eah" && corrResult.analyzed > 0 && ` (${corrResult.analyzed} alertes analysées)`}
                      </p>
                    </div>
                  )}

                  {!corrLoading && !corrResult && (
                    <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                      <p className="text-[10px] text-muted-foreground">Service IA indisponible</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/40 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400"/>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90">
                      Contexte assainissement
                    </p>
                    {eahLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto"/>}
                  </div>

                  {incidentQuartier ? (
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                      <p className="text-[10px] text-cyan-200">Quartier rattaché: {incidentQuartier}</p>
                      {eahContext.length > 0 ? (
                        <>
                          <p className="text-[10px] text-muted-foreground">
                            {eahContext.length} installation(s) d'assainissement non opérationnelle(s) dans la même zone
                          </p>
                          <div className="space-y-2">
                            {eahContext.slice(0, 3).map((site) => (
                              <div key={site.id} className="rounded-md border border-cyan-500/20 bg-background/60 px-2.5 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-foreground">{site.name}</p>
                                  <span className="text-[10px] text-cyan-300">{site.status}</span>
                                </div>
                                <p className="mt-1 text-[10px] text-muted-foreground">{site.address}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          Aucune installation d'assainissement critique trouvée dans ce quartier.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Le quartier n&apos;a pas pu être déduit automatiquement pour ce signalement.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions workflow */}
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {isActive(selected.status) && (
                      <>
                        {selected.status === "Nouveau" && (
                          <Button size="sm"
                            className="col-span-2 h-8 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 gap-1"
                            onClick={() => updateStatus(selected.id, "En cours")}
                            disabled={updating === selected.id}>
                            {updating === selected.id
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin"/> Traitement…</>
                              : <><Clock className="h-3 w-3"/> Prendre en charge</>
                            }
                          </Button>
                        )}
                        <Button size="sm"
                          className="col-span-2 h-8 text-xs bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 gap-1"
                          onClick={() => updateStatus(selected.id, "Résolu")}
                          disabled={updating === selected.id}>
                          {updating === selected.id
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin"/> Traitement…</>
                            : <><CheckCircle2 className="h-3 w-3"/> Marquer Résolu</>
                          }
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
                          onClick={() => updateStatus(selected.id, "Fermé")}
                          disabled={updating === selected.id}>
                          <XCircle className="h-3 w-3"/> Fermer
                        </Button>
                      </>
                    )}
                    {(selected.status === "Résolu" || selected.status === "Fermé") && (
                      <>
                        <div className="col-span-2 flex items-center gap-2 py-1.5 text-xs text-green-400">
                          <CheckCircle className="h-4 w-4"/>
                          {selected.status === "Résolu" ? "Résolu" : "Fermé"}
                          {selected.resolvedAt && ` — ${selected.resolvedAt}`}
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 col-span-2"
                          onClick={() => updateStatus(selected.id, "Nouveau")}
                          disabled={updating === selected.id}>
                          <RotateCcw className="h-3 w-3"/> Réouvrir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
