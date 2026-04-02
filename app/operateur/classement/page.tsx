"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Trophy, Users, MapPin, TrendingUp, RefreshCw, Star, Award, CheckCircle2, Zap
} from "lucide-react"
import type { GlobalLeaderboard, BadgeCode, QuartierLeaderboard } from "@/lib/types"
import { cn } from "@/lib/utils"

// ── Constantes badges (client) ─────────────────────────────────────────────────
const BADGES: Record<BadgeCode, { icon: string; color: string; label: string }> = {
  premier_pas:  { icon: "🌱", color: "#22c55e", label: "Premier Pas"  },
  vigilant:     { icon: "👁️",  color: "#3b82f6", label: "Vigilant"     },
  expert:       { icon: "🎯",  color: "#8b5cf6", label: "Expert"       },
  champion:     { icon: "🏆",  color: "#f59e0b", label: "Champion"     },
  sentinelle:   { icon: "🛡️",  color: "#06b6d4", label: "Sentinelle"  },
  ambassadeur:  { icon: "🌟",  color: "#ec4899", label: "Ambassadeur" },
}

const RANK_COLORS = ["text-amber-400", "text-slate-300", "text-amber-600"]
const RANK_BG = ["bg-amber-500/10 border-amber-500/30", "bg-slate-500/10 border-slate-500/30", "bg-amber-700/10 border-amber-700/30"]

function BadgePills({ badges, max = 3 }: { badges: BadgeCode[]; max?: number }) {
  if (!badges.length) return null
  const top = [...badges].slice(-max)
  return (
    <span className="inline-flex items-center gap-0.5">
      {top.map(b => (
        <span key={b} title={BADGES[b].label} className="text-base leading-none">{BADGES[b].icon}</span>
      ))}
      {badges.length > max && (
        <span className="text-[10px] text-muted-foreground ml-0.5">+{badges.length - max}</span>
      )}
    </span>
  )
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className={cn("text-xs font-bold w-6 text-center", "text-muted-foreground")}>#{rank}</span>
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

// ── Classement global ──────────────────────────────────────────────────────────
function GlobalRanking({ data }: { data: GlobalLeaderboard }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" /> Classement Général
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">Mis à jour {timeAgo(data.updatedAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {/* Top 3 podium */}
        {data.citizens.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[data.citizens[1], data.citizens[0], data.citizens[2]].map((c, i) => {
              const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3
              const isFirst = actualRank === 1
              return (
                <div key={c.userId} className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center",
                  isFirst ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-border/30 bg-muted/10"
                )}>
                  <RankMedal rank={actualRank} />
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
                    isFirst ? "border-amber-400/60 bg-amber-500/20 text-amber-300" : "border-border/40 bg-muted/20"
                  )}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold leading-tight truncate w-full">{c.name.split(" ")[0]}</p>
                  <p className={cn("text-sm font-bold", isFirst ? "text-amber-400" : "text-muted-foreground")}>{c.totalPoints}<span className="text-[10px] ml-0.5">pts</span></p>
                  <BadgePills badges={c.badges} max={2} />
                  {c.quartierPrincipal && (
                    <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{c.quartierPrincipal}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Liste complète */}
        <div className="divide-y divide-border/30">
          {data.citizens.slice(3).map(c => (
            <div key={c.userId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/10 rounded-lg transition-colors">
              <span className="text-xs text-muted-foreground/60 w-6 text-center font-mono">#{c.rank}</span>
              <div className="w-7 h-7 rounded-full bg-muted/20 border border-border/40 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <BadgePills badges={c.badges} max={3} />
                </div>
                {c.quartierPrincipal && (
                  <p className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />{c.quartierPrincipal}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-sm font-bold text-teal-400">{c.totalPoints} <span className="text-[10px] text-muted-foreground">pts</span></p>
                <p className="text-[10px] text-muted-foreground/60">{c.signalements} signal. · {c.confirmes} conf.</p>
              </div>
            </div>
          ))}
          {data.citizens.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Aucun citoyen avec des points pour l'instant.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Classement par quartier ────────────────────────────────────────────────────
function QuartierCard({ q }: { q: QuartierLeaderboard }) {
  const tauxColor = q.tauxConfirmation >= 60 ? "text-green-400" : q.tauxConfirmation >= 30 ? "text-amber-400" : "text-slate-400"
  const statusColor = q.totalSignalements > 10
    ? "border-red-500/30 bg-red-500/5"
    : q.totalSignalements > 3
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-border/30 bg-muted/5"

  return (
    <Card className={cn("border", statusColor)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-teal-400" /> {q.quartier}
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> {q.totalSignalements} signal.
            </span>
            <span className={cn("font-semibold", tauxColor)}>
              {q.tauxConfirmation}% conf.
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {q.topCitizens.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 py-2">Aucun signalement confirmé dans ce quartier.</p>
        ) : (
          <div className="space-y-2">
            {q.topCitizens.map((c, i) => (
              <div key={c.userId} className="flex items-center gap-2">
                <span className="text-sm w-5 shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                <p className="flex-1 text-xs truncate font-medium">{c.name}</p>
                <BadgePills badges={c.badges} max={2} />
                <span className="text-xs font-bold text-teal-400 shrink-0">{c.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Stats rapides ──────────────────────────────────────────────────────────────
function QuickStats({ data }: { data: GlobalLeaderboard }) {
  const totalSignalements = data.quartierLeaderboards.reduce((s, q) => s + q.totalSignalements, 0)
  const totalConfirmes = data.quartierLeaderboards.reduce((s, q) => s + q.totalConfirmes, 0)
  const tauxGlobal = totalSignalements > 0 ? Math.round((totalConfirmes / totalSignalements) * 100) : 0
  const totalBadges = data.citizens.reduce((s, c) => s + c.badges.length, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { icon: Users, label: "Citoyens actifs",    value: data.citizens.length, color: "text-blue-400"   },
        { icon: Zap,   label: "Signalements total", value: totalSignalements,    color: "text-amber-400"  },
        { icon: CheckCircle2, label: "Confirmés IA",value: `${tauxGlobal}%`,     color: "text-green-400"  },
        { icon: Award, label: "Badges distribués",  value: totalBadges,          color: "text-purple-400" },
      ].map(({ icon: Icon, label, value, color }) => (
        <Card key={label} className="border-border/40">
          <CardContent className="pt-4 pb-3 px-4">
            <Icon className={cn("h-4 w-4 mb-1", color)} />
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function ClassementPage() {
  const [data, setData] = useState<GlobalLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"global" | "quartiers">("global")

  const load = () => {
    setLoading(true)
    fetch("/api/operateur/classement", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <DashboardLayout role="operateur" pageTitle="Classement Citoyens">
      <div className="space-y-5">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" /> Classement & Engagement Citoyens
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Suivi des points par quartier et reconnaissance des signaleurs les plus fiables
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg px-3 py-2 transition-colors">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>

        {/* KPIs */}
        {loading
          ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          : data ? <QuickStats data={data} /> : null
        }

        {/* Onglets */}
        <div className="flex gap-1 rounded-lg border border-border/40 bg-muted/10 p-1 w-fit">
          {([
            { key: "global",    label: "Classement général", icon: Trophy   },
            { key: "quartiers", label: "Par quartier",        icon: MapPin   },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === key
                  ? "bg-background text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : !data ? (
          <Card className="border-border/40">
            <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
              Impossible de charger le classement.
            </CardContent>
          </Card>
        ) : activeTab === "global" ? (
          <GlobalRanking data={data} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.quartierLeaderboards
              .filter(q => q.totalSignalements > 0 || q.topCitizens.length > 0)
              .sort((a, b) => b.totalSignalements - a.totalSignalements)
              .map(q => <QuartierCard key={q.quartier} q={q} />)
            }
            {data.quartierLeaderboards.filter(q => q.totalSignalements === 0).map(q => (
              <Card key={q.quartier} className="border-border/20 opacity-40">
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">{q.quartier} — aucun signalement</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
