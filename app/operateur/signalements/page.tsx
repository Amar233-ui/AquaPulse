"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquareWarning, Search, Clock, CheckCircle2, XCircle,
  AlertTriangle, User, MapPin, Calendar, RefreshCw, Zap,
  ChevronRight, Inbox, Phone, Mail, ArrowRight
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorIncident, IncidentSummary } from "@/lib/types"

interface SignalementsResponse {
  items: OperatorIncident[]
  summary: IncidentSummary
}

const EMPTY: SignalementsResponse = {
  items: [],
  summary: { nouveau: 0, enCours: 0, resolu: 0, total: 0 },
}

// Correlations IA simulées (dans un vrai projet, viendraient de l'API)
const AI_CORRELATIONS: Record<string, { alertId: string; confidence: number; type: string }> = {
  fuite:        { alertId: "ALT-001", confidence: 87, type: "Acoustique anormale" },
  pression:     { alertId: "ALT-003", confidence: 72, type: "Débit anormal" },
  qualite:      { alertId: "ALT-005", confidence: 91, type: "Contamination suspectée" },
  contamination:{ alertId: "ALT-005", confidence: 91, type: "Contamination suspectée" },
  coupure:      { alertId: "ALT-002", confidence: 65, type: "Panne pompe" },
}

const STATUS_CONFIG = {
  "Nouveau":  { color: "bg-red-500/15 text-red-400 border-red-500/30",   dot: "bg-red-400",   label: "Nouveau"   },
  "En cours": { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400", label: "En cours"  },
  "Résolu":   { color: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400", label: "Résolu"    },
  "Fermé":    { color: "bg-slate-500/15 text-slate-400 border-slate-500/30", dot: "bg-slate-400", label: "Fermé"     },
}

const TYPE_ICONS: Record<string, string> = {
  fuite: "💧", qualite: "🧪", pression: "⚡", coupure: "🚫",
  odeur: "👃", contamination: "⚠️", autre: "📋",
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60)      return "il y a quelques secondes"
    if (diff < 3600)    return `il y a ${Math.floor(diff/60)} min`
    if (diff < 86400)   return `il y a ${Math.floor(diff/3600)}h`
    return `il y a ${Math.floor(diff/86400)}j`
  } catch { return dateStr }
}

export default function SignalementsPage() {
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("all")
  const [selected, setSelected] = useState<OperatorIncident | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [refresh,  setRefresh]  = useState(0)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (search)           p.set("search", search)
    if (status !== "all") p.set("status", status)
    const s = p.toString()
    return `/api/operateur/signalements${s ? `?${s}` : ""}?_r=${refresh}`
  }, [search, status, refresh])

  const { data, loading } = useApiQuery<SignalementsResponse>(query, EMPTY)

  const updateStatus = useCallback(async (id: number, newStatus: string) => {
    setUpdating(id)
    try {
      await fetch(`/api/operateur/signalements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      setRefresh(r => r + 1)
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, status: newStatus as OperatorIncident["status"] } : null)
      }
    } finally {
      setUpdating(null)
    }
  }, [selected])

  const nouveaux = data.items.filter(i => i.status === "Nouveau")
  const enCours  = data.items.filter(i => i.status === "En cours")

  return (
    <DashboardLayout role="operateur" title="Signalements Citoyens">
      <div className="flex h-full gap-4" style={{ minHeight: "calc(100vh - 9rem)" }}>

        {/* ── LISTE ── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: "Nouveaux",    value: data.summary.nouveau, color: "border-l-red-500",   icon: Inbox,        urgent: true },
              { label: "En cours",    value: data.summary.enCours, color: "border-l-amber-500", icon: Clock,        urgent: false },
              { label: "Résolus",     value: data.summary.resolu,  color: "border-l-green-500", icon: CheckCircle2, urgent: false },
              { label: "Total",       value: data.summary.total,   color: "border-l-slate-500", icon: MessageSquareWarning, urgent: false },
            ].map(k => (
              <Card key={k.label} className={`border-l-4 ${k.color} border-border/60 shadow-sm`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.urgent ? "bg-red-500/10" : "bg-muted/40"}`}>
                    <k.icon className={`h-4 w-4 ${k.urgent ? "text-red-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className={`text-2xl font-bold ${k.urgent && k.value > 0 ? "text-red-400" : "text-foreground"}`}>{k.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtres */}
          <Card className="border border-border/60 shadow-sm shrink-0">
            <CardContent className="flex flex-wrap items-center gap-3 p-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher par type, lieu, description…" className="pl-8 h-9"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Nouveau">Nouveau</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Résolu">Résolu</SelectItem>
                  <SelectItem value="Fermé">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setRefresh(r => r + 1)}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
              </Button>
            </CardContent>
          </Card>

          {/* ── Nouveaux en urgence ── */}
          {nouveaux.length > 0 && (
            <Card className="border border-red-500/30 bg-red-500/5 shadow-sm shrink-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                  </span>
                  {nouveaux.length} signalement{nouveaux.length > 1 ? "s" : ""} non traité{nouveaux.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {nouveaux.slice(0, 3).map(inc => (
                  <div key={inc.id}
                    onClick={() => setSelected(inc)}
                    className="flex items-center justify-between rounded-lg border border-red-500/20 bg-card p-3 cursor-pointer hover:bg-red-500/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{TYPE_ICONS[inc.type] ?? "📋"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inc.type.charAt(0).toUpperCase() + inc.type.slice(1)}</p>
                        <p className="text-xs text-muted-foreground">{inc.location} · {timeAgo(inc.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                        onClick={e => { e.stopPropagation(); updateStatus(inc.id, "En cours") }}
                        disabled={updating === inc.id}>
                        Prendre en charge
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Liste complète ── */}
          <Card className="border border-border/60 shadow-sm flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">
                Tous les signalements
                <span className="ml-2 text-xs font-normal text-muted-foreground">({data.items.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquareWarning className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Aucun signalement trouvé</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {data.items.map(inc => {
                    const sc = STATUS_CONFIG[inc.status] ?? STATUS_CONFIG["Nouveau"]
                    const corr = AI_CORRELATIONS[inc.type.toLowerCase()]
                    const isSelected = selected?.id === inc.id
                    return (
                      <div key={inc.id}
                        onClick={() => setSelected(isSelected ? null : inc)}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                        <span className="text-xl shrink-0">{TYPE_ICONS[inc.type.toLowerCase()] ?? "📋"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              #{inc.id} — {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)}
                            </span>
                            {corr && (
                              <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded">
                                <Zap className="h-2.5 w-2.5" /> IA {corr.confidence}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{inc.location}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{timeAgo(inc.createdAt)}</span>
                          <Badge variant="outline" className={`text-[10px] ${sc.color}`}>
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${sc.dot} inline-block`} />
                            {sc.label}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
          <div className="w-80 shrink-0 flex flex-col gap-3 sticky top-0" style={{ maxHeight: "calc(100vh - 9rem)", overflowY: "auto" }}>
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{TYPE_ICONS[selected.type.toLowerCase()] ?? "📋"}</span>
                      <CardTitle className="text-sm font-semibold">
                        Signalement #{selected.id}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_CONFIG[selected.status]?.color ?? ""}`}>
                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot ?? ""} inline-block`} />
                      {selected.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelected(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">

                {/* Type + lieu */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{selected.type.charAt(0).toUpperCase() + selected.type.slice(1)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs leading-relaxed">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{timeAgo(selected.createdAt)} · {selected.createdAt}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                  <p className="text-xs leading-relaxed text-foreground/80">{selected.description}</p>
                </div>

                {/* Signalant */}
                {(selected.reporterName || selected.reporterEmail) && (
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Signalé par</p>
                    {selected.reporterName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{selected.reporterName}</span>
                      </div>
                    )}
                    {selected.reporterEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${selected.reporterEmail}`} className="text-xs text-primary hover:underline">{selected.reporterEmail}</a>
                      </div>
                    )}
                  </div>
                )}

                {/* Corrélation IA */}
                {AI_CORRELATIONS[selected.type.toLowerCase()] && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-400">Corrélation IA détectée</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alerte <span className="font-mono text-amber-400">{AI_CORRELATIONS[selected.type.toLowerCase()].alertId}</span> —{" "}
                      {AI_CORRELATIONS[selected.type.toLowerCase()].type}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${AI_CORRELATIONS[selected.type.toLowerCase()].confidence}%` }} />
                      </div>
                      <span className="text-[10px] text-amber-400 font-semibold">{AI_CORRELATIONS[selected.type.toLowerCase()].confidence}%</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-amber-400 px-0 gap-1 hover:bg-transparent hover:text-amber-300">
                      Voir l'alerte <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Actions workflow */}
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.status === "Nouveau" && (
                      <Button size="sm" className="col-span-2 h-8 text-xs bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25"
                        onClick={() => updateStatus(selected.id, "En cours")} disabled={updating === selected.id}>
                        <Clock className="h-3 w-3 mr-1" /> Prendre en charge
                      </Button>
                    )}
                    {selected.status === "En cours" && (
                      <Button size="sm" className="col-span-2 h-8 text-xs bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25"
                        onClick={() => updateStatus(selected.id, "Résolu")} disabled={updating === selected.id}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Marquer Résolu
                      </Button>
                    )}
                    {selected.status !== "Fermé" && selected.status !== "Nouveau" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs"
                        onClick={() => updateStatus(selected.id, "Fermé")} disabled={updating === selected.id}>
                        Fermer
                      </Button>
                    )}
                    {selected.status === "Résolu" || selected.status === "Fermé" ? null : (
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" disabled>
                        <Phone className="h-3 w-3" /> Rappeler
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
