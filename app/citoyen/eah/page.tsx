"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api-query"
import type { EahFacility, EahDashboardData } from "@/lib/types"
import {
  Droplets, MapPin, CheckCircle, AlertTriangle, XCircle,
  Search, ChevronDown, Users, BookOpen, HandHeart, Waves,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const QUARTIERS = [
  "Tous", "Plateau", "Médina", "Fann", "HLM",
  "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye",
]

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  latrine_publique:     { label: "Latrine publique",      icon: "🚻" },
  point_eau_gratuit:    { label: "Point d'eau gratuit",   icon: "💧" },
  borne_fontaine:       { label: "Borne-fontaine",        icon: "⛲" },
  bloc_hygiene:         { label: "Bloc hygiène",          icon: "🧼" },
  station_lavage_mains: { label: "Lavage mains",          icon: "🖐" },
}

const STATUS_CONFIG = {
  operationnel: { label: "Opérationnel", color: "border-teal-500/30 bg-teal-950/20 text-teal-400", dot: "bg-teal-400", badge: "bg-teal-500/15 text-teal-300 border-teal-500/25" },
  "degradé":    { label: "Dégradé",     color: "border-orange-500/30 bg-orange-950/20 text-orange-400", dot: "bg-orange-400", badge: "bg-orange-500/15 text-orange-300 border-orange-500/25" },
  hors_service: { label: "Hors service", color: "border-red-500/30 bg-red-950/20 text-red-400", dot: "bg-red-400", badge: "bg-red-500/15 text-red-300 border-red-500/25" },
}

const COMMUNITY_CONFIG = {
  none: { label: "Aucun signalement", badge: "bg-slate-500/15 text-slate-300 border-slate-500/25" },
  to_verify: { label: "À vérifier", badge: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  probable: { label: "Probable", badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" },
  confirmed: { label: "Confirmé par la communauté", badge: "bg-rose-500/15 text-rose-300 border-rose-500/25" },
} as const

const EMPTY_DASHBOARD: EahDashboardData = {
  stats: { total_facilities: 0, operational: 0, degraded: 0, out_of_service: 0, gender_accessible: 0, schools_covered: 0 },
  zone_stats: [],
  recent_reports: [],
}
const EMPTY_LIST = { items: [] as EahFacility[], total: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// Composant carte installation
// ─────────────────────────────────────────────────────────────────────────────

function FacilityCard({ f }: { f: EahFacility }) {
  const sc = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.hors_service
  const tc = TYPE_LABELS[f.type] ?? { label: f.type, icon: "📍" }
  const cc = COMMUNITY_CONFIG[f.community_confirmation ?? "none"]

  return (
    <div className={`rounded-xl border p-4 transition-all ${sc.color}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{tc.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{f.name}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{tc.label}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.badge}`}>
          {sc.label}
        </span>
      </div>

      {f.community_signal_count ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cc.badge}`}>
            <Users className="h-2.5 w-2.5" /> {cc.label}
          </span>
          <span className="text-[10px] text-foreground/55">
            {f.community_signal_count} signalement{f.community_signal_count > 1 ? "s" : ""} citoyen{f.community_signal_count > 1 ? "s" : ""}
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-foreground/55 mb-2">
        <MapPin className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{f.address}</span>
      </div>

      {/* Tags accessibilité */}
      <div className="flex flex-wrap gap-1.5">
        {f.gender_accessible && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-300">
            <HandHeart className="h-2.5 w-2.5" /> Femmes / Hygiène menstruelle
          </span>
        )}
        {f.disabled_accessible && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
            ♿ PMR
          </span>
        )}
        {f.school_nearby && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">
            <BookOpen className="h-2.5 w-2.5" /> École
          </span>
        )}
      </div>

      {f.notes && f.status !== "operationnel" && (
        <p className="mt-2 text-xs text-foreground/50 italic leading-relaxed">
          ⚠ {f.notes}
        </p>
      )}

      <Link
        href={`/citoyen/signaler?quartier=${encodeURIComponent(f.quartier)}&eah=${f.id}`}
        className="mt-3 inline-flex text-xs font-medium text-teal-300 underline underline-offset-2"
      >
        Signaler ce site
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "carte" | "liste" | "infos"

export default function CitoyenEahPage() {
  const [onglet, setOnglet] = useState<Tab>("liste")
  const [quartier, setQuartier] = useState("Tous")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("tous")

  const { data: dashboard, loading: dashLoading } = useApiQuery<EahDashboardData>(
    "/api/citoyen/eah?mode=dashboard", EMPTY_DASHBOARD
  )
  const { data: listData, loading: listLoading } = useApiQuery<typeof EMPTY_LIST>(
    `/api/citoyen/eah${quartier !== "Tous" ? `?quartier=${encodeURIComponent(quartier)}` : ""}`,
    EMPTY_LIST
  )

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

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "liste",  label: "Installations",  icon: MapPin },
    { id: "carte",  label: "Par quartier",   icon: Waves },
    { id: "infos",  label: "Informations",   icon: BookOpen },
  ]

  return (
    <DashboardLayout role="citoyen" title="EAH — Assainissement & Hygiène">
      <div className="space-y-5 pb-10">

        {/* ── HERO STATS ── */}
        {dashLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: CheckCircle, label: "Opérationnels", value: dashboard.stats.operational, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/25" },
              { icon: AlertTriangle, label: "Dégradés", value: dashboard.stats.degraded, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/25" },
              { icon: XCircle, label: "Hors service", value: dashboard.stats.out_of_service, color: "text-red-400", bg: "bg-red-500/10 border-red-500/25" },
              { icon: HandHeart, label: "Accès femmes", value: dashboard.stats.gender_accessible, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/25" },
              { icon: BookOpen, label: "Écoles couvertes", value: dashboard.stats.schools_covered, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/25" },
              { icon: Droplets, label: "Total sites", value: dashboard.stats.total_facilities, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border p-3.5 ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color} mb-1.5`} />
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-foreground/55">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setOnglet(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                onglet === tab.id
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-foreground/65 hover:text-foreground hover:bg-secondary/50"
              }`}>
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══ LISTE INSTALLATIONS ══ */}
        {onglet === "liste" && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un site..."
                  className="w-full rounded-xl border border-border/50 bg-card/60 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
              </div>
              {/* Quartier */}
              <div className="relative">
                <select value={quartier} onChange={e => setQuartier(e.target.value)}
                  className="appearance-none rounded-xl border border-border/50 bg-card/60 pl-3 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer">
                  {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
              </div>
              {/* Statut */}
              <div className="relative">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none rounded-xl border border-border/50 bg-card/60 pl-3 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer">
                  <option value="tous">Tous statuts</option>
                  <option value="operationnel">Opérationnel</option>
                  <option value="degradé">Dégradé</option>
                  <option value="hors_service">Hors service</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
              </div>
            </div>

            {/* Résultats */}
            {listLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 px-6 py-10 text-center">
                <MapPin className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <p className="font-semibold text-foreground/60">Aucun site trouvé</p>
                <p className="text-sm text-foreground/40 mt-1">Essayez d'autres filtres</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-foreground/45 px-1">{filtered.length} site{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p>
                <div className="space-y-3">
                  {filtered.map(f => <FacilityCard key={f.id} f={f} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ PAR QUARTIER ══ */}
        {onglet === "carte" && (
          <div className="space-y-3">
            <p className="text-xs text-foreground/45 px-1">Score d'accès EAH par quartier (% sites opérationnels)</p>
            {dashLoading ? (
              <div className="space-y-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              dashboard.zone_stats.map(z => {
                const color = z.score >= 80 ? "bg-teal-400" : z.score >= 50 ? "bg-orange-400" : "bg-red-400"
                const textColor = z.score >= 80 ? "text-teal-400" : z.score >= 50 ? "text-orange-400" : "text-red-400"
                const borderColor = z.score >= 80 ? "border-teal-500/25 bg-teal-950/10" : z.score >= 50 ? "border-orange-500/25 bg-orange-950/10" : "border-red-500/25 bg-red-950/10"
                return (
                  <div key={z.quartier} className={`rounded-xl border p-4 ${borderColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{z.quartier}</p>
                        <p className="text-xs text-foreground/50 mt-0.5">
                          {z.operationnel}/{z.total} opérationnels
                          {z.hors_service > 0 && <span className="text-red-400 ml-2">· {z.hors_service} hors service</span>}
                          {z.has_gender_facility && <span className="text-pink-400 ml-2">· ♀ accès femmes</span>}
                        </p>
                      </div>
                      <span className={`text-lg font-bold tabular-nums ${textColor}`}>{z.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${z.score}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ══ INFORMATIONS EAH ══ */}
        {onglet === "infos" && (
          <div className="space-y-3">
            {[
              {
                icon: "💧", title: "Accès à l'eau potable",
                body: "Des bornes-fontaines et points d'eau gratuits sont disponibles dans chaque quartier. En cas de panne, signalez-le via l'onglet Signaler.",
                color: "border-teal-500/25 bg-teal-950/15",
              },
              {
                icon: "🚻", title: "Latrines et toilettes publiques",
                body: "Les latrines publiques sont gérées par la mairie. Un espace dédié à l'hygiène menstruelle est disponible dans les sites marqués ♀.",
                color: "border-blue-500/25 bg-blue-950/15",
              },
              {
                icon: "🧼", title: "Hygiène des mains",
                body: "Le lavage régulier des mains protège contre les maladies. Des stations de lavage sont installées près des marchés et lieux publics.",
                color: "border-purple-500/25 bg-purple-950/15",
              },
              {
                icon: "🏫", title: "Écoles et lieux publics",
                body: "Chaque école doit disposer de blocs hygiène séparés filles/garçons. Signalez tout manquement pour protéger les élèves.",
                color: "border-pink-500/25 bg-pink-950/15",
              },
              {
                icon: "📞", title: "Urgences et signalements",
                body: "Numéro SDE (eau potable) : 800 800 800 (gratuit). Pour l'assainissement, contactez ONAS au 33 839 96 00.",
                color: "border-orange-500/25 bg-orange-950/15",
              },
            ].map(item => (
              <div key={item.title} className={`rounded-xl border px-4 py-4 ${item.color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                    <p className="text-xs text-foreground/65 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
