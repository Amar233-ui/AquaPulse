"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api-query"
import { useMarkNotificationsViewed } from "@/hooks/use-mark-notifications-viewed"
import type { EahFacility, EahDashboardData } from "@/lib/types"
import {
  CheckCircle, AlertTriangle, XCircle, Search, ChevronDown,
  RefreshCw, MapPin, BookOpen, HandHeart, Droplets, Waves,
  ClipboardList, ChevronRight, X, Save, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const QUARTIERS = [
  "Tous", "Plateau", "Médina", "Fann", "HLM",
  "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye",
]

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  latrine_publique:     { label: "Latrine publique",    icon: "🚻" },
  point_eau_gratuit:    { label: "Point d'eau gratuit", icon: "💧" },
  borne_fontaine:       { label: "Borne-fontaine",      icon: "⛲" },
  bloc_hygiene:         { label: "Bloc hygiène",        icon: "🧼" },
  station_lavage_mains: { label: "Lavage mains",        icon: "🖐" },
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; row: string; dot: string }> = {
  operationnel: {
    label: "Opérationnel",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/25",
    row: "border-teal-500/20 bg-teal-950/10",
    dot: "bg-teal-400",
  },
  "degradé": {
    label: "Dégradé",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    row: "border-orange-500/20 bg-orange-950/10",
    dot: "bg-orange-400",
  },
  hors_service: {
    label: "Hors service",
    badge: "bg-red-500/15 text-red-300 border-red-500/25",
    row: "border-red-500/20 bg-red-950/10",
    dot: "bg-red-400",
  },
}

const COMMUNITY_CONFIG = {
  none: { label: "Aucun signalement", color: "border-slate-500/20 bg-slate-500/10 text-slate-300" },
  to_verify: { label: "À vérifier", color: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  probable: { label: "Probable", color: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300" },
  confirmed: { label: "Confirmé communauté", color: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
} as const

const EMPTY_DASHBOARD: EahDashboardData = {
  stats: { total_facilities: 0, operational: 0, degraded: 0, out_of_service: 0, gender_accessible: 0, schools_covered: 0 },
  zone_stats: [],
  recent_reports: [],
}
const EMPTY_LIST = { items: [] as EahFacility[], total: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// Panel détail / mise à jour statut
// ─────────────────────────────────────────────────────────────────────────────

function DetailPanel({
  facility,
  onClose,
  onUpdated,
}: {
  facility: EahFacility
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState(facility.status)
  const [notes, setNotes] = useState(facility.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskMessage, setTaskMessage] = useState<string | null>(null)

  const sc = STATUS_CONFIG[facility.status] ?? STATUS_CONFIG.hors_service
  const tc = TYPE_LABELS[facility.type] ?? { label: facility.type, icon: "📍" }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/operateur/eah/${facility.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, notes: notes.trim() || undefined }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => { setSaved(false); onUpdated() }, 1200)
      }
    } finally {
      setSaving(false)
    }
  }, [facility.id, status, notes, onUpdated])

  const handleCreateTask = useCallback(async () => {
    setCreatingTask(true)
    setTaskMessage(null)
    try {
      const res = await fetch("/api/operateur/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eahFacilityId: facility.id,
          facilityName: facility.name,
          facilityType: facility.type,
          quartier: facility.quartier,
          facilityStatus: facility.status,
          schoolNearby: facility.school_nearby,
          genderAccessible: facility.gender_accessible,
        }),
      })

      const data = await res.json().catch(() => ({})) as { taskId?: string; alreadyExists?: boolean }
      if (res.ok) {
        setTaskMessage(
          data.alreadyExists
            ? `Un bon existe déjà (${data.taskId})`
            : `Bon d'intervention créé (${data.taskId})`,
        )
      } else {
        setTaskMessage("Création impossible pour le moment")
      }
    } finally {
      setCreatingTask(false)
    }
  }, [facility])

  const hasChange = status !== facility.status || notes.trim() !== (facility.notes ?? "").trim()
  const community = COMMUNITY_CONFIG[facility.community_confirmation ?? "none"]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tc.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug">{facility.name}</p>
              <p className="text-xs text-foreground/50">{tc.label} · {facility.quartier}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Adresse */}
          <div className="flex items-center gap-2 text-sm text-foreground/65">
            <MapPin className="h-4 w-4 flex-shrink-0 text-foreground/40" />
            {facility.address}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {facility.community_signal_count ? (
              <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border", community.color)}>
                <ClipboardList className="h-3 w-3" />
                {community.label} · {facility.community_signal_count} signalement{facility.community_signal_count > 1 ? "s" : ""}
              </span>
            ) : null}
            {facility.gender_accessible && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-300">
                <HandHeart className="h-3 w-3" /> Accès femmes
              </span>
            )}
            {facility.disabled_accessible && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                ♿ PMR
              </span>
            )}
            {facility.school_nearby && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">
                <BookOpen className="h-3 w-3" /> École
              </span>
            )}
          </div>

          {/* Dernière inspection */}
          {facility.last_inspection && (
            <p className="text-xs text-foreground/45">
              Dernière inspection : {new Date(facility.last_inspection).toLocaleDateString("fr-FR")}
            </p>
          )}
          {facility.last_community_report_at && (
            <p className="text-xs text-foreground/45">
              Dernier signalement citoyen : {new Date(facility.last_community_report_at).toLocaleDateString("fr-FR")}
            </p>
          )}

          {/* Mise à jour statut */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Statut</p>
            <div className="grid grid-cols-3 gap-2">
              {(["operationnel", "degradé", "hors_service"] as const).map(s => {
                const c = STATUS_CONFIG[s]
                const active = status === s
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all text-center",
                      active ? c.badge + " scale-[1.02]" : "border-border/40 text-foreground/55 hover:border-border/70 hover:text-foreground"
                    )}>
                    <span className={cn("block h-1.5 w-1.5 rounded-full mx-auto mb-1.5", active ? c.dot : "bg-foreground/20")} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Notes / Observations</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Décrivez le problème constaté ou l'action menée…"
              className="w-full rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {(facility.status === "hors_service" || facility.status === "degradé") && (
            <div className="mb-3 space-y-2">
              <button onClick={handleCreateTask} disabled={creatingTask}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-60"
                )}>
                {creatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                {creatingTask ? "Création du bon…" : "Créer un bon d'intervention"}
              </button>
              {taskMessage && (
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200">
                  <p>{taskMessage}</p>
                  <Link href="/operateur/maintenance" className="mt-1 inline-block text-cyan-300 underline underline-offset-2">
                    Ouvrir la maintenance
                  </Link>
                </div>
              )}
            </div>
          )}
          <button onClick={handleSave} disabled={!hasChange || saving}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
              saved
                ? "bg-teal-500/20 border border-teal-500/40 text-teal-300"
                : hasChange
                ? "bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30"
                : "bg-secondary/30 border border-border/30 text-foreground/30 cursor-not-allowed"
            )}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "liste" | "zones" | "priorités"

export default function OperateurEahPage() {
  useMarkNotificationsViewed(["eah"])

  const [onglet, setOnglet] = useState<Tab>("liste")
  const [quartier, setQuartier] = useState("Tous")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("tous")
  const [selected, setSelected] = useState<EahFacility | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: dashboard, loading: dashLoading, refetch: refetchDash } =
    useApiQuery<EahDashboardData>(`/api/operateur/eah?mode=dashboard&_k=${refreshKey}`, EMPTY_DASHBOARD)

  const { data: listData, loading: listLoading, refetch: refetchList } =
    useApiQuery<typeof EMPTY_LIST>(
      `/api/operateur/eah${quartier !== "Tous" ? `?quartier=${encodeURIComponent(quartier)}` : ""}` + `&_k=${refreshKey}`,
      EMPTY_LIST
    )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([refetchDash(), refetchList()])
    setRefreshKey(k => k + 1)
    setTimeout(() => setIsRefreshing(false), 600)
  }, [refetchDash, refetchList])

  const filtered = useMemo(() => {
    let items = listData.items
    if (filterStatus !== "tous") items = items.filter(f => f.status === filterStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.quartier.toLowerCase().includes(q)
      )
    }
    return items
  }, [listData.items, filterStatus, search])

  // Sites prioritaires = hors_service + dégradés avec école ou accès femmes
  const prioritaires = useMemo(() =>
    listData.items.filter(f =>
      f.status === "hors_service" ||
      (f.status === "degradé" && (f.school_nearby || f.gender_accessible))
    ).sort((a, b) => {
      if (a.status === "hors_service" && b.status !== "hors_service") return -1
      if (b.status === "hors_service" && a.status !== "hors_service") return 1
      return 0
    })
  , [listData.items])

  const maintenanceBacklog = useMemo(
    () => listData.items.filter((f) => f.status !== "operationnel").length,
    [listData.items],
  )

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "liste",     label: "Tous les sites",  icon: ClipboardList },
    { id: "zones",     label: "Par zone",        icon: Waves },
    { id: "priorités", label: "Priorités",       icon: AlertTriangle, badge: prioritaires.length },
  ]

  return (
    <DashboardLayout role="operateur" title="Gestion Assainissement">

      {selected && (
        <DetailPanel
          facility={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); handleRefresh() }}
        />
      )}

      <div className="space-y-5 pb-10">

        {/* ── KPIs ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">Vue d'ensemble assainissement</h2>
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary/50 transition-all disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualiser
          </button>
        </div>

        {dashLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Total sites" value={String(dashboard.stats.total_facilities)} icon={<Droplets className="h-5 w-5 text-blue-400" />} />
            <KPICard label="Opérationnels" value={String(dashboard.stats.operational)} icon={<CheckCircle className="h-5 w-5 text-teal-400" />} />
            <KPICard label="Dégradés" value={String(dashboard.stats.degraded)} icon={<AlertTriangle className="h-5 w-5 text-orange-400" />} />
            <KPICard label="Hors service" value={String(dashboard.stats.out_of_service)} icon={<XCircle className="h-5 w-5 text-red-400" />} />
            <KPICard label="Accès femmes" value={String(dashboard.stats.gender_accessible)} icon={<HandHeart className="h-5 w-5 text-pink-400" />} />
            <KPICard label="Écoles" value={String(dashboard.stats.schools_covered)} icon={<BookOpen className="h-5 w-5 text-purple-400" />} />
          </div>
        )}

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <p className="text-sm font-semibold text-cyan-200">L'assainissement est maintenant intégré au workflow opérateur</p>
          <p className="mt-1 text-xs text-foreground/65">
            Un site dégradé ou hors service peut maintenant générer un bon d&apos;intervention et suivre sa remise en service via la maintenance.
            {maintenanceBacklog > 0 ? ` ${maintenanceBacklog} site(s) demandent encore une action.` : " Aucun site n'attend d'action pour le moment."}
          </p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setOnglet(tab.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition-all",
                onglet === tab.id
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                  : "text-foreground/65 hover:text-foreground hover:bg-secondary/50"
              )}>
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ LISTE TOUS LES SITES ══ */}
        {onglet === "liste" && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une installation…"
                  className="w-full rounded-xl border border-border/50 bg-card/60 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div className="relative">
                <select value={quartier} onChange={e => setQuartier(e.target.value)}
                  className="appearance-none rounded-xl border border-border/50 bg-card/60 pl-3 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer">
                  {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none rounded-xl border border-border/50 bg-card/60 pl-3 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer">
                  <option value="tous">Tous statuts</option>
                  <option value="operationnel">Opérationnel</option>
                  <option value="degradé">Dégradé</option>
                  <option value="hors_service">Hors service</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
              </div>
            </div>

            {listLoading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 px-6 py-10 text-center">
                <MapPin className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <p className="font-semibold text-foreground/60">Aucun site trouvé</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-foreground/45 px-1">{filtered.length} site{filtered.length > 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {filtered.map(f => {
                    const sc = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.hors_service
                    const tc = TYPE_LABELS[f.type] ?? { label: f.type, icon: "📍" }
                    return (
                      <button key={f.id} onClick={() => setSelected(f)}
                        className={cn("w-full rounded-xl border p-4 text-left transition-all hover:scale-[1.005] hover:shadow-md", sc.row)}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-lg flex-shrink-0">{tc.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                              <p className="text-xs text-foreground/50 mt-0.5 truncate">{f.quartier} · {f.address}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {f.gender_accessible && <HandHeart className="h-3.5 w-3.5 text-pink-400" />}
                            {f.school_nearby && <BookOpen className="h-3.5 w-3.5 text-purple-400" />}
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", sc.badge)}>
                              {sc.label}
                            </span>
                            <ChevronRight className="h-4 w-4 text-foreground/30" />
                          </div>
                        </div>
                        {f.community_signal_count ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", COMMUNITY_CONFIG[f.community_confirmation ?? "none"].color)}>
                              {COMMUNITY_CONFIG[f.community_confirmation ?? "none"].label}
                            </span>
                            <span className="text-[10px] text-foreground/55">
                              {f.community_signal_count} signalement{f.community_signal_count > 1 ? "s" : ""} citoyen{f.community_signal_count > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : null}
                        {f.notes && f.status !== "operationnel" && (
                          <p className="mt-2 text-xs text-foreground/45 italic line-clamp-1">⚠ {f.notes}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ PAR ZONE ══ */}
        {onglet === "zones" && (
          <div className="space-y-3">
            {dashLoading ? (
              <div className="space-y-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (
              dashboard.zone_stats.map(z => {
                const color = z.score >= 80 ? "bg-teal-400" : z.score >= 50 ? "bg-orange-400" : "bg-red-400"
                const textColor = z.score >= 80 ? "text-teal-400" : z.score >= 50 ? "text-orange-400" : "text-red-400"
                const border = z.score >= 80 ? "border-teal-500/20 bg-teal-950/10" : z.score >= 50 ? "border-orange-500/20 bg-orange-950/10" : "border-red-500/20 bg-red-950/10"
                return (
                  <div key={z.quartier} className={cn("rounded-xl border p-4", border)}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{z.quartier}</p>
                        <p className="text-xs text-foreground/50 mt-0.5">
                          {z.operationnel}/{z.total} opérationnels
                          {z.hors_service > 0 && <span className="text-red-400 ml-2">· {z.hors_service} hors service</span>}
                          {z.has_gender_facility && <span className="text-pink-400 ml-2">· ♀</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-xl font-bold tabular-nums", textColor)}>{z.score}%</span>
                        <p className="text-[10px] text-foreground/40">état</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${z.score}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ══ PRIORITÉS ══ */}
        {onglet === "priorités" && (
          <div className="space-y-4">
            {listLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : prioritaires.length === 0 ? (
              <div className="rounded-xl border border-teal-500/25 bg-teal-950/20 px-6 py-10 text-center">
                <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                <p className="font-semibold text-teal-300">Aucune urgence assainissement</p>
                <p className="text-sm text-foreground/60 mt-1">Tous les sites critiques sont opérationnels</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-red-500/25 bg-red-950/15 px-4 py-3">
                  <p className="text-sm font-semibold text-red-300">
                    {prioritaires.length} site{prioritaires.length > 1 ? "s" : ""} nécessitant une intervention prioritaire
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5">
                    Hors service + sites dégradés proches d'écoles ou avec accès femmes
                  </p>
                </div>
                <div className="space-y-2">
                  {prioritaires.map(f => {
                    const sc = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.hors_service
                    const tc = TYPE_LABELS[f.type] ?? { label: f.type, icon: "📍" }
                    return (
                      <button key={f.id} onClick={() => setSelected(f)}
                        className={cn("w-full rounded-xl border p-4 text-left transition-all hover:scale-[1.005]", sc.row)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-lg flex-shrink-0 mt-0.5">{tc.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{f.name}</p>
                              <p className="text-xs text-foreground/50 mt-0.5">{f.quartier} · {f.address}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {f.community_signal_count ? (
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", COMMUNITY_CONFIG[f.community_confirmation ?? "none"].color)}>
                                    {f.community_signal_count} signalement{f.community_signal_count > 1 ? "s" : ""}
                                  </span>
                                ) : null}
                                {f.gender_accessible && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-300">
                                    ♀ Femmes
                                  </span>
                                )}
                                {f.school_nearby && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">
                                    École
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", sc.badge)}>
                              {sc.label}
                            </span>
                            <ChevronRight className="h-4 w-4 text-foreground/30" />
                          </div>
                        </div>
                        {f.notes && (
                          <p className="mt-2.5 text-xs text-foreground/50 italic line-clamp-2 pl-9">⚠ {f.notes}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
