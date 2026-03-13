"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenDashboardData, CitizenIncident } from "@/lib/types"
import {
  Droplets, Bell, CheckCircle, XCircle, Clock, MapPin, Send,
  ChevronDown, Share2, RefreshCw, FileText, TrendingUp, TrendingDown,
  Minus, Zap, AlertTriangle,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const QUARTIERS = [
  "Plateau", "Médina", "Fann", "HLM",
  "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye", "Rufisque",
]
const STORAGE_KEY = "aqp_citoyen_quartier"

const EMPTY_DATA: CitizenDashboardData = {
  qualityScore: 0, temperature: 0, networkState: "—", activeAlerts: 0,
  networkHealth: 0, activeSensorsRate: 0, pressureRate: 0,
  waterQualityIndicators: [], recentAlerts: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge circulaire SVG animée
// ─────────────────────────────────────────────────────────────────────────────
function QualityGauge({ score, isPotable }: { score: number; isPotable: boolean }) {
  const R = 52
  const SW = 10
  const C = 2 * Math.PI * R
  // Arc de 240° (de 150° à 390°), centre en haut-gauche → haut-droite
  const ARC = C * (240 / 360)
  const filled = ARC * (score / 100)
  const color = isPotable ? "#2dd4bf" : score > 50 ? "#fbbf24" : "#f87171"
  const trackColor = "rgba(148,163,184,0.1)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 120 }}>
      <svg width="140" height="120" viewBox="0 0 140 120" style={{ transform: "rotate(-210deg)" }}>
        {/* Track */}
        <circle cx="70" cy="70" r={R} fill="none" stroke={trackColor} strokeWidth={SW}
          strokeDasharray={`${ARC} ${C}`} strokeLinecap="round" />
        {/* Valeur animée */}
        <circle cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth={SW}
          strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      {/* Texte centré */}
      <div className="absolute flex flex-col items-center justify-center" style={{ top: 18 }}>
        <span className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
        <span className="text-xs text-foreground/50 mt-0.5">/ 100</span>
        <span className={`text-xs font-semibold mt-1 ${isPotable ? "text-teal-400" : "text-red-400"}`}>
          {isPotable ? "✓ Potable" : "⚠ Attention"}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline micro-graphique SVG
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ value, status }: { value: string; status: string }) {
  const num = parseFloat(value) || 0
  // Génère 7 points pseudo-aléatoires basés sur la valeur courante
  const seed = num * 13.7
  const pts = Array.from({ length: 7 }, (_, i) => {
    const v = num * (0.9 + 0.2 * Math.abs(Math.sin(seed + i * 2.3)))
    return Math.max(0, v)
  })
  pts[6] = num // le dernier point = valeur réelle

  const min = Math.min(...pts) * 0.95
  const max = Math.max(...pts) * 1.05
  const range = max - min || 1
  const W = 56, H = 20
  const coords = pts.map((v, i) => `${(i / 6) * W},${H - ((v - min) / range) * H}`)
  const color = status === "normal" ? "#2dd4bf" : status === "alerte" ? "#fbbf24" : "#f87171"

  const TrendIcon = pts[6] > pts[0] ? TrendingUp : pts[6] < pts[0] ? TrendingDown : Minus
  const trendColor = status === "normal" ? "text-teal-400" : status === "alerte" ? "text-orange-400" : "text-red-400"

  return (
    <div className="flex items-center gap-2">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <polyline points={coords.join(" ")} fill="none" stroke={color} strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
        <circle cx={coords[6].split(",")[0]} cy={coords[6].split(",")[1]} r="2.5" fill={color} />
      </svg>
      <TrendIcon className={`h-3 w-3 ${trendColor}`} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Conseil contextuel
// ─────────────────────────────────────────────────────────────────────────────
function getContextualAdvice(indicators: CitizenDashboardData["waterQualityIndicators"], quartier: string): { icon: string; title: string; body: string; color: string } {
  const turb = indicators.find(i => i.label === "Turbidité")
  const chlore = indicators.find(i => i.label === "Chlore résiduel")
  const ph = indicators.find(i => i.label === "pH")
  const temp = indicators.find(i => i.label === "Température")

  if (turb?.status === "critique" || chlore?.status === "critique") {
    return { icon: "🚫", title: "Eau non recommandée à la consommation", body: `Les mesures de ${quartier} indiquent une contamination potentielle. Faites bouillir l'eau avant toute consommation et signalez si vous constatez une odeur ou une couleur anormale.`, color: "border-red-500/35 bg-red-950/20 text-red-300" }
  }
  if (turb?.status === "alerte") {
    return { icon: "⚠️", title: "Eau légèrement trouble aujourd'hui", body: `La turbidité à ${quartier} est au-dessus de la norme. Préférez filtrer l'eau avant de la boire. La situation est surveillée par les équipes SDE.`, color: "border-orange-500/30 bg-orange-950/15 text-orange-300" }
  }
  if (chlore?.status === "alerte") {
    return { icon: "💧", title: "Chlore en dessous de la norme", body: "Un niveau de chlore bas réduit la protection contre les bactéries. Consommez l'eau bouillie ou en bouteille par précaution. Les équipes interviennent.", color: "border-orange-500/30 bg-orange-950/15 text-orange-300" }
  }
  if (ph?.status === "alerte") {
    return { icon: "🧪", title: "pH légèrement hors norme", body: `Le pH de l'eau à ${quartier} est en dehors de la plage optimale. L'eau reste utilisable mais peut affecter son goût. Évitez une consommation prolongée.`, color: "border-orange-500/30 bg-orange-950/15 text-orange-300" }
  }
  if (temp?.status === "alerte") {
    return { icon: "🌡️", title: "Température de l'eau élevée", body: "Par temps chaud, l'eau peut atteindre des températures favorisant le développement bactérien. Laissez couler l'eau quelques secondes avant de la consommer.", color: "border-yellow-500/30 bg-yellow-950/15 text-yellow-300" }
  }
  return { icon: "✅", title: "Eau conforme à toutes les normes SDE", body: `L'eau à ${quartier} répond à tous les critères de potabilité OMS ce matin. pH, turbidité, chlore résiduel : tout est dans les normes. Vous pouvez consommer l'eau du robinet en toute confiance.`, color: "border-teal-500/25 bg-teal-950/15 text-teal-300" }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "eau" | "alertes" | "signalements"

const STATUS_COLORS: Record<string, string> = {
  "Nouveau": "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  "En cours": "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  "Résolu": "bg-teal-500/15 text-teal-400 border border-teal-500/25",
  "Fermé": "bg-slate-500/15 text-slate-400 border border-slate-500/25",
}

export default function CitoyenDashboard() {
  const router = useRouter()
  const [quartier, setQuartier] = useState("Plateau")
  const [onglet, setOnglet] = useState<Tab>("eau")
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [quickView, setQuickView] = useState(false)
  const [alertesActives, setAlertesActives] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && QUARTIERS.includes(saved)) setQuartier(saved)
    } catch {}
  }, [])

  const handleQuartierChange = (q: string) => {
    setQuartier(q)
    try { localStorage.setItem(STORAGE_KEY, q) } catch {}
  }

  const { data, loading, refetch } = useApiQuery<CitizenDashboardData>(
    `/api/citoyen/dashboard?quartier=${encodeURIComponent(quartier)}&_k=${refreshKey}`,
    EMPTY_DATA
  )
  const { data: incidents, loading: incLoading } = useApiQuery<CitizenIncident[]>(
    `/api/citoyen/mes-signalements?_k=${refreshKey}`,
    []
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([refetch()])
    setRefreshKey(k => k + 1)
    setTimeout(() => setIsRefreshing(false), 600)
  }, [refetch])

  const handleShare = async () => {
    const potable = data.qualityScore >= 80
    const text = `💧 Eau à ${quartier} — ${potable ? "✅ Potable" : "⚠️ Attention"} (score ${data.qualityScore}/100)\nSource : AquaPulse SDE Dakar`
    try {
      if (navigator.share) await navigator.share({ title: "AquaPulse", text })
      else await navigator.clipboard.writeText(text)
    } catch {}
  }

  const isPotable = data.qualityScore >= 80
  const advice = getContextualAdvice(data.waterQualityIndicators, quartier)

  const phInd   = data.waterQualityIndicators.find(i => i.label === "pH")
  const turbInd = data.waterQualityIndicators.find(i => i.label === "Turbidité")
  const chlorInd = data.waterQualityIndicators.find(i => i.label === "Chlore résiduel")

  const newIncidents = incidents.filter(i => i.status === "Nouveau" || i.status === "En cours").length

  const TABS: { id: Tab; icon: React.ElementType; label: string; badge?: number }[] = [
    { id: "eau",          icon: Droplets,    label: "Mon Eau" },
    { id: "alertes",      icon: Bell,        label: "Alertes", badge: data.recentAlerts.length },
    { id: "signalements", icon: FileText,    label: "Mes signalements", badge: newIncidents },
  ]

  // ── Mode "Buvable ?" ──────────────────────────────────────────────────────
  if (quickView) {
    return (
      <DashboardLayout role="citoyen" title="Mon Eau">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
          <div className={`rounded-3xl border-2 p-10 w-full max-w-xs ${isPotable ? "border-teal-400/50 bg-teal-950/30" : "border-red-400/50 bg-red-950/30"}`}>
            <div className="text-6xl mb-4">{isPotable ? "✅" : "❌"}</div>
            <div className={`text-4xl font-black mb-2 ${isPotable ? "text-teal-300" : "text-red-300"}`}>
              {isPotable ? "OUI" : "NON"}
            </div>
            <div className="text-lg font-semibold text-foreground/80 mb-1">L&apos;eau de {quartier}</div>
            <div className={`text-sm ${isPotable ? "text-teal-400" : "text-red-400"}`}>
              {isPotable ? "est potable" : "n'est pas recommandée"}
            </div>
            <div className="text-xs text-foreground/40 mt-3">Score {data.qualityScore}/100</div>
          </div>
          <p className="text-sm text-foreground/60 max-w-xs leading-relaxed">{advice.body}</p>
          <button onClick={() => setQuickView(false)} className="text-sm text-teal-400 underline underline-offset-2">
            Voir tous les détails →
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="citoyen" title="Mon Eau">
      <div className="space-y-5 pb-10">

        {/* Barre d'actions top */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <div className="relative">
              <select value={quartier} onChange={e => handleQuartierChange(e.target.value)}
                className="appearance-none rounded-xl border border-teal-500/30 bg-teal-500/10 pl-3 pr-8 py-2 text-sm font-semibold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer">
                {QUARTIERS.map(q => <option key={q} value={q} className="bg-card text-foreground">{q}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-teal-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuickView(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary/50 transition-all">
              <Zap className="h-3.5 w-3.5 text-yellow-400" /> Buvable ?
            </button>
            <button onClick={handleRefresh} disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary/50 transition-all disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary/50 transition-all">
              <Share2 className="h-3.5 w-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* ── HERO CARD avec jauge animée ── */}
        {loading ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : (
          <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-7 ${
            isPotable
              ? "bg-gradient-to-br from-teal-950/90 to-teal-900/50 border border-teal-500/40"
              : "bg-gradient-to-br from-red-950/90 to-red-900/50 border border-red-500/40"
          }`}>
            <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl opacity-20 ${isPotable ? "bg-teal-400" : "bg-red-400"}`} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Jauge */}
              <div className="flex-shrink-0 flex justify-center">
                <QualityGauge score={data.qualityScore} isPotable={isPotable} />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-1">
                  Qualité de l&apos;eau — {quartier}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  {isPotable
                    ? <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0" />
                    : <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  }
                  <h2 className={`text-xl font-bold ${isPotable ? "text-teal-200" : "text-red-200"}`}>
                    {isPotable ? "Eau potable" : "Attention requise"}
                  </h2>
                </div>

                {/* Indicateurs clés avec sparklines */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "pH",        ind: phInd    },
                    { label: "Turbidité", ind: turbInd  },
                    { label: "Chlore",    ind: chlorInd },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-black/25 px-3 py-2.5 backdrop-blur-sm">
                      <div className={`text-base font-bold ${
                        item.ind?.status === "normal"   ? "text-teal-300"
                        : item.ind?.status === "alerte"  ? "text-orange-400"
                        : item.ind?.status === "critique" ? "text-red-400"
                        : "text-foreground/40"}`}>
                        {item.ind?.value ?? "—"}
                      </div>
                      <div className="text-[10px] text-foreground/50">{item.label}</div>
                      {item.ind && <Sparkline value={item.ind.value} status={item.ind.status} />}
                    </div>
                  ))}
                </div>

                {/* KPIs */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Réseau",   value: `${data.networkHealth}%`,     warn: data.networkHealth < 80 },
                    { label: "Capteurs", value: `${data.activeSensorsRate}%`, warn: data.activeSensorsRate < 80 },
                    { label: "Pression", value: `${data.pressureRate}%`,      warn: data.pressureRate < 60 },
                    { label: "Alertes",  value: String(data.activeAlerts),    warn: data.activeAlerts > 0 },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-black/20 px-3 py-1.5 backdrop-blur-sm">
                      <div className={`text-sm font-bold ${item.warn ? "text-orange-400" : "text-foreground"}`}>{item.value}</div>
                      <div className="text-[10px] text-foreground/50">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONSEIL CONTEXTUEL ── */}
        {!loading && (
          <div className={`rounded-xl border px-4 py-3.5 ${advice.color}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{advice.icon}</span>
              <div>
                <p className="text-sm font-semibold">{advice.title}</p>
                <p className="text-xs leading-relaxed mt-1 opacity-80">{advice.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── BANNIÈRE SIGNALER ── */}
        <button onClick={() => router.push("/citoyen/signaler")}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-orange-500/30 bg-orange-500/8 px-5 py-3.5 text-left transition-all hover:bg-orange-500/12 hover:border-orange-500/50 group">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/20 shrink-0">
              <Send className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-300">Vous voyez un problème ?</p>
              <p className="text-xs text-foreground/65">Fuite, eau trouble, coupure… signalez-le en 30 secondes</p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-3 py-1.5 rounded-lg group-hover:bg-orange-500/25 transition-colors whitespace-nowrap">
            Signaler →
          </span>
        </button>

        {/* ── TABS ── */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setOnglet(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                onglet === tab.id
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-foreground/65 hover:text-foreground hover:bg-secondary/50"
              }`}>
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ MON EAU ══ */}
        {onglet === "eau" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide px-1">Indicateurs détaillés</h3>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {data.waterQualityIndicators.map(param => (
                  <div key={param.label} className={`flex items-center justify-between rounded-xl border px-4 py-3.5 ${
                    param.status === "normal"   ? "border-teal-500/25 bg-teal-950/20"
                    : param.status === "alerte" ? "border-orange-500/30 bg-orange-950/20"
                    : "border-red-500/30 bg-red-950/20"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{param.label}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">Cible : {param.target}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkline value={param.value} status={param.status} />
                      <div className="text-right">
                        <p className={`text-base font-bold ${
                          param.status === "normal"   ? "text-teal-300"
                          : param.status === "alerte" ? "text-orange-400"
                          : "text-red-400"
                        }`}>{param.value}</p>
                        <p className={`text-[10px] font-semibold uppercase ${
                          param.status === "normal"   ? "text-teal-500"
                          : param.status === "alerte" ? "text-orange-500"
                          : "text-red-500"
                        }`}>{param.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infos complémentaires */}
            <div className="space-y-2 pt-2">
              {[
                { emoji: "📡", label: "État réseau",           value: data.networkState },
                { emoji: "📊", label: "Score qualité",          value: `${data.qualityScore} / 100` },
                { emoji: "📞", label: "Urgence eau (gratuit)",  value: <a href="tel:800800800" className="font-semibold text-teal-400 hover:underline" onClick={e => e.stopPropagation()}>800 800 800</a> },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-sm text-foreground/70">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ALERTES ══ */}
        {onglet === "alertes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-4 py-3.5">
              <div>
                <p className="font-semibold text-sm">Notifications — {quartier}</p>
                <p className="text-xs text-foreground/55 mt-0.5">Recevoir les alertes de votre secteur</p>
              </div>
              <button onClick={() => setAlertesActives(!alertesActives)}
                className={`relative h-6 w-11 rounded-full transition-colors ${alertesActives ? "bg-teal-500" : "bg-secondary"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alertesActives ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : data.recentAlerts.length === 0 ? (
              <div className="rounded-xl border border-teal-500/25 bg-teal-950/20 px-6 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                <p className="font-semibold text-teal-300">Aucune alerte pour {quartier}</p>
                <p className="text-sm text-foreground/60 mt-1">Le réseau fonctionne normalement dans votre secteur</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentAlerts.map(alert => (
                  <div key={alert.id} className={`rounded-xl border p-4 ${
                    alert.type === "critique" ? "border-red-500/35 bg-red-950/25"
                    : alert.type === "alerte"  ? "border-orange-500/35 bg-orange-950/20"
                    : "border-border/40 bg-card/60"
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {alert.type === "critique"
                          ? <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 animate-pulse" />
                          : <Bell className="h-4 w-4 text-orange-400 flex-shrink-0" />}
                        <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-foreground/50 flex-shrink-0">
                        <Clock className="h-3 w-3" />{alert.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MES SIGNALEMENTS ══ */}
        {onglet === "signalements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Mes signalements</h3>
              <button onClick={() => router.push("/citoyen/signaler")}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                + Nouveau
              </button>
            </div>

            {incLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (incidents as CitizenIncident[]).length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 px-6 py-10 text-center">
                <FileText className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <p className="font-semibold text-foreground/60">Aucun signalement</p>
                <p className="text-sm text-foreground/40 mt-1">Vos signalements apparaîtront ici avec leur statut de traitement</p>
                <button onClick={() => router.push("/citoyen/signaler")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-sm font-semibold px-4 py-2 hover:bg-teal-500/20 transition-colors">
                  <Send className="h-3.5 w-3.5" /> Faire un signalement
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(incidents as CitizenIncident[]).map(inc => (
                  <div key={inc.id} className={`rounded-xl border p-4 ${
                    inc.status === "Résolu"   ? "border-teal-500/25 bg-teal-950/15"
                    : inc.status === "En cours" ? "border-orange-500/25 bg-orange-950/15"
                    : inc.status === "Fermé"   ? "border-border/30 bg-card/40"
                    : "border-blue-500/25 bg-blue-950/15"
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs font-mono text-foreground/35 mr-2">#{inc.id}</span>
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {inc.type === "fuite" ? "Fuite d'eau" : inc.type === "qualite" ? "Qualité" : inc.type === "pression" ? "Pression" : inc.type === "coupure" ? "Coupure" : inc.type}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[inc.status] ?? "bg-muted text-muted-foreground"}`}>
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 mb-1">📍 {inc.location}</p>
                    <p className="text-xs text-foreground/50 line-clamp-1">{inc.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-foreground/35 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{inc.createdAt}
                      </span>
                      {inc.resolvedAt && (
                        <span className="text-xs text-teal-400/70">✅ Résolu le {inc.resolvedAt}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
