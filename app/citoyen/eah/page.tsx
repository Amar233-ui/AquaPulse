"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api-query"
import type { EahFacility, EahFacilityType } from "@/lib/types"
import { AlertTriangle, CheckCircle, ChevronDown, MapPin, Users, XCircle } from "lucide-react"

const QUARTIERS = [
  "Plateau",
  "Médina",
  "Fann",
  "HLM",
  "Grand Dakar",
  "Parcelles Assainies",
  "Pikine",
  "Guédiawaye",
] as const

const STORAGE_KEY = "aqp_citoyen_quartier"

const EMPTY_LIST = { items: [] as EahFacility[], total: 0 }

const TYPE_META: Record<EahFacilityType, { label: string; icon: string }> = {
  latrine_publique:     { label: "Toilettes publiques", icon: "🚻" },
  point_eau_gratuit:    { label: "Points d'eau",        icon: "💧" },
  borne_fontaine:       { label: "Bornes-fontaines",    icon: "⛲" },
  bloc_hygiene:         { label: "Blocs hygiène",       icon: "🧼" },
  station_lavage_mains: { label: "Lavage des mains",    icon: "👐" },
}

const STATUS_META = {
  operationnel: { label: "OK",          badge: "bg-teal-500/15 text-teal-300 border-teal-500/25", icon: CheckCircle },
  "degradé":    { label: "À réparer",   badge: "bg-amber-500/15 text-amber-300 border-amber-500/25", icon: AlertTriangle },
  hors_service: { label: "Hors service",badge: "bg-rose-500/15 text-rose-300 border-rose-500/25", icon: XCircle },
} as const

function FacilityRow({ facility, quartier }: { facility: EahFacility; quartier: string }) {
  const type = TYPE_META[facility.type]
  const status = STATUS_META[facility.status]

  const reporters = facility.community_unique_reporters ?? facility.community_signal_count ?? 0
  const hasCommunity = (facility.community_signal_count ?? 0) > 0

  const reportHref =
    `/citoyen/signaler?mode=eah&quartier=${encodeURIComponent(quartier)}&eah=${encodeURIComponent(String(facility.id))}`

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{type?.icon ?? "🏢"}</span>
            <p className="font-semibold text-foreground truncate">{facility.name}</p>
          </div>

          <p className="text-xs text-foreground/55 mt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-foreground/40" />
            <span className="truncate">{facility.address}</span>
          </p>

          {hasCommunity && (
            <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-foreground/40" />
              <span>
                Signalé par {reporters} personne{reporters > 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${status.badge}`}>
            {status.label}
          </span>
          <Link
            href={reportHref}
            className="text-xs font-semibold rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-300 px-3 py-1.5 hover:bg-teal-500/15"
          >
            Signaler
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CitizenSanitationPage() {
  const searchParams = useSearchParams()
  const [quartier, setQuartier] = useState<(typeof QUARTIERS)[number]>("Médina")
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    try {
      const fromQuery = searchParams.get("quartier")
      if (fromQuery && (QUARTIERS as readonly string[]).includes(fromQuery)) {
        setQuartier(fromQuery as (typeof QUARTIERS)[number])
        localStorage.setItem(STORAGE_KEY, fromQuery)
        return
      }

      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (QUARTIERS as readonly string[]).includes(saved)) {
        setQuartier(saved as (typeof QUARTIERS)[number])
      }
    } catch {}
  }, [searchParams])

  const handleQuartierChange = (value: string) => {
    if (!(QUARTIERS as readonly string[]).includes(value)) return
    setQuartier(value as (typeof QUARTIERS)[number])
    try { localStorage.setItem(STORAGE_KEY, value) } catch {}
  }

  const { data: listData, loading: listLoading, error } = useApiQuery<typeof EMPTY_LIST>(
    `/api/citoyen/eah?quartier=${encodeURIComponent(quartier)}`,
    EMPTY_LIST,
  )

  const summary = useMemo(() => {
    const items = listData.items ?? []
    const total = items.length
    const ok = items.filter((f) => f.status === "operationnel").length
    const degraded = items.filter((f) => f.status === "degradé").length
    const out = items.filter((f) => f.status === "hors_service").length
    const issues = items
      .filter((f) => f.status !== "operationnel")
      .sort((a, b) => (a.status === b.status ? 0 : a.status === "hors_service" ? -1 : 1))

    const byType: Record<EahFacilityType, number> = {
      latrine_publique: 0,
      point_eau_gratuit: 0,
      borne_fontaine: 0,
      bloc_hygiene: 0,
      station_lavage_mains: 0,
    }
    for (const f of items) {
      byType[f.type] = (byType[f.type] ?? 0) + 1
    }

    return { total, ok, degraded, out, issues, byType }
  }, [listData.items])

  const headline = summary.out > 0
    ? `${summary.out} installation${summary.out > 1 ? "s" : ""} hors service dans votre zone`
    : summary.degraded > 0
      ? `${summary.degraded} installation${summary.degraded > 1 ? "s" : ""} à réparer dans votre zone`
      : summary.total > 0
        ? "Tout semble fonctionner dans votre zone"
        : "Aucune installation trouvée pour cette zone"

  return (
    <DashboardLayout role="citoyen" title="Hygiène & Assainissement">
      <div className="space-y-5 pb-10">

        {/* Barre d'actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <div className="relative">
              <select
                value={quartier}
                onChange={(e) => handleQuartierChange(e.target.value)}
                className="appearance-none rounded-xl border border-teal-500/30 bg-teal-500/10 pl-3 pr-8 py-2 text-sm font-semibold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
              >
                {QUARTIERS.map((q) => (
                  <option key={q} value={q} className="bg-card text-foreground">
                    {q}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-teal-300/70" />
            </div>
          </div>

          <Link
            href={`/citoyen/signaler?mode=eah&quartier=${encodeURIComponent(quartier)}`}
            className="rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-300 hover:bg-teal-500/15"
          >
            Signaler un problème
          </Link>
        </div>

        {/* Résumé simple */}
        {listLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
            <p className="text-xs text-foreground/50">Dans {quartier}</p>
            <p className="text-lg font-bold text-foreground mt-1">{headline}</p>
            <p className="text-sm text-foreground/60 mt-1">
              {summary.total} installation{summary.total > 1 ? "s" : ""} au total
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {[
                { label: "OK", value: summary.ok, tone: "border-teal-500/25 bg-teal-500/10 text-teal-300", icon: CheckCircle },
                { label: "À réparer", value: summary.degraded, tone: "border-amber-500/25 bg-amber-500/10 text-amber-300", icon: AlertTriangle },
                { label: "Hors service", value: summary.out, tone: "border-rose-500/25 bg-rose-500/10 text-rose-300", icon: XCircle },
                { label: "Toilettes", value: summary.byType.latrine_publique, tone: "border-blue-500/25 bg-blue-500/10 text-blue-300", icon: Users },
              ].map((card) => (
                <div key={card.label} className={`rounded-xl border p-3 ${card.tone}`}>
                  <div className="flex items-center justify-between">
                    <card.icon className="h-4 w-4 opacity-90" />
                    <span className="text-lg font-bold tabular-nums">{card.value}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {(
                Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>
              ).map((key) => (
                <div
                  key={key}
                  className="rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-xs text-foreground/70"
                >
                  <span className="mr-1">{TYPE_META[key].icon}</span>
                  {TYPE_META[key].label}: <span className="font-semibold text-foreground/85">{summary.byType[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Erreur API */}
        {error && !listLoading && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-rose-200">Impossible de charger les données</p>
            <p className="text-xs text-foreground/65 mt-1">{error}</p>
          </div>
        )}

        {/* Problèmes dans la zone */}
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Ce qui ne va pas dans {quartier}</p>
              <p className="text-xs text-foreground/50">Cliquez “Signaler” si vous constatez le problème.</p>
            </div>
            <span className="text-xs text-foreground/50">{summary.issues.length} à traiter</span>
          </div>

          {listLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : summary.issues.length === 0 ? (
            <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 px-4 py-4">
              <p className="text-sm font-semibold text-teal-200">Aucun problème visible pour l’instant ✅</p>
              <p className="text-xs text-foreground/60 mt-1">
                Si vous remarquez un souci, utilisez “Signaler un problème”.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.issues.map((facility) => (
                <FacilityRow key={facility.id} facility={facility} quartier={quartier} />
              ))}
            </div>
          )}
        </div>

        {/* Toutes les installations */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full rounded-2xl border border-border/50 bg-card/50 px-4 py-3 flex items-center justify-between hover:bg-card/70"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Toutes les installations</p>
              <p className="text-xs text-foreground/50">{summary.total} dans {quartier}</p>
            </div>
            <span className="text-sm font-semibold text-teal-300">{showAll ? "Masquer" : "Afficher"}</span>
          </button>

          {showAll && (
            <div className="space-y-2">
              {listLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {listData.items.map((facility) => (
                    <FacilityRow key={facility.id} facility={facility} quartier={quartier} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conseils ultra simples */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
          <p className="text-sm font-semibold text-foreground">À retenir</p>
          <ul className="mt-2 space-y-2 text-sm text-foreground/70">
            <li>• Changez de zone en haut pour voir un autre quartier.</li>
            <li>• “Signaler” aide à confirmer rapidement un problème.</li>
            <li>• Plus il y a de signalements, plus la priorité augmente côté opérateur.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
