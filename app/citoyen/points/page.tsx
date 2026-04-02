"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Star, Zap, MapPin, Clock, TrendingUp, Award, ChevronRight } from "lucide-react"
import type { CitizenPointsProfile, BadgeCode } from "@/lib/types"
import Link from "next/link"

// ── Définition des badges (côté client) ───────────────────────────────────────
const BADGES: Record<BadgeCode, { label: string; icon: string; color: string; bg: string; description: string; threshold: number }> = {
  premier_pas:  { label: "Premier Pas",   icon: "🌱", color: "#22c55e", bg: "bg-green-500/15 border-green-500/30",   description: "1er signalement soumis",              threshold: 0   },
  vigilant:     { label: "Vigilant",       icon: "👁️",  color: "#3b82f6", bg: "bg-blue-500/15 border-blue-500/30",    description: "50 pts accumulés",                    threshold: 50  },
  expert:       { label: "Expert",         icon: "🎯",  color: "#8b5cf6", bg: "bg-purple-500/15 border-purple-500/30", description: "150 pts – signalements fiables",      threshold: 150 },
  champion:     { label: "Champion",       icon: "🏆",  color: "#f59e0b", bg: "bg-amber-500/15 border-amber-500/30",  description: "300 pts – pilier communauté",         threshold: 300 },
  sentinelle:   { label: "Sentinelle",     icon: "🛡️",  color: "#06b6d4", bg: "bg-cyan-500/15 border-cyan-500/30",   description: "500 pts – gardien du réseau",         threshold: 500 },
  ambassadeur:  { label: "Ambassadeur",    icon: "🌟",  color: "#ec4899", bg: "bg-pink-500/15 border-pink-500/30",   description: "1000 pts – légende AquaPulse",        threshold: 1000},
}

const BADGE_ORDER: BadgeCode[] = ["premier_pas","vigilant","expert","champion","sentinelle","ambassadeur"]

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  premier_signalement:   { label: "1er signalement 🌟",            color: "text-green-400"  },
  signalement_soumis:    { label: "Signalement soumis",            color: "text-teal-400"   },
  signalement_confirme:  { label: "Signalement confirmé par l'IA", color: "text-blue-400"   },
  signalement_valide_ia: { label: "Validé IA (haute confiance)",   color: "text-purple-400" },
  signalement_resolu:    { label: "Signalement résolu ✅",          color: "text-teal-400"   },
  signalement_critique:  { label: "Alerte critique confirmée 🚨",  color: "text-red-400"    },
  badge_vigilant:        { label: "Badge Vigilant débloqué 🎉",    color: "text-blue-400"   },
  badge_expert:          { label: "Badge Expert débloqué 🎉",      color: "text-purple-400" },
  badge_champion:        { label: "Badge Champion débloqué 🎉",    color: "text-amber-400"  },
}

function timeAgo(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return "à l'instant"
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    return `il y a ${Math.floor(diff / 86400)}j`
  } catch { return dateStr }
}

// ── Jauge de progression circulaire ───────────────────────────────────────────
function ProgressRing({ points, nextThreshold, currentBadge }: { points: number; nextThreshold: number | null; currentBadge: BadgeCode | null }) {
  const pct = nextThreshold ? Math.min(100, (points / nextThreshold) * 100) : 100
  const R = 54, SW = 9
  const C = 2 * Math.PI * R
  const ARC = C * (240 / 360)
  const filled = ARC * (pct / 100)
  const color = currentBadge ? BADGES[currentBadge].color : "#2dd4bf"

  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 128 }}>
      <svg width="148" height="128" viewBox="0 0 148 128" style={{ transform: "rotate(-210deg)" }}>
        <circle cx="74" cy="74" r={R} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={SW}
          strokeDasharray={`${ARC} ${C}`} strokeLinecap="round" />
        <circle cx="74" cy="74" r={R} fill="none" stroke={color} strokeWidth={SW}
          strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 8px ${color}99)` }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ top: 18 }}>
        <span className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{points}</span>
        <span className="text-xs text-muted-foreground mt-0.5">points</span>
        {nextThreshold && (
          <span className="text-[10px] text-muted-foreground/60 mt-1">/ {nextThreshold}</span>
        )}
      </div>
    </div>
  )
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ code, earned, awardedAt }: { code: BadgeCode; earned: boolean; awardedAt?: string }) {
  const def = BADGES[code]
  return (
    <div className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
      earned ? `${def.bg} shadow-sm` : "border-border/30 bg-muted/10 opacity-40 grayscale"
    }`}>
      <span className="text-3xl" style={{ filter: earned ? "none" : "grayscale(1)" }}>{def.icon}</span>
      <div className="text-center">
        <p className="text-xs font-bold" style={{ color: earned ? def.color : undefined }}>{def.label}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{def.description}</p>
        {earned && awardedAt && (
          <p className="text-[9px] text-muted-foreground/60 mt-1">Obtenu {timeAgo(awardedAt)}</p>
        )}
        {!earned && (
          <p className="text-[9px] text-muted-foreground/50 mt-1">À partir de {def.threshold} pts</p>
        )}
      </div>
      {earned && (
        <span className="absolute -top-1.5 -right-1.5 text-[10px] rounded-full bg-green-500 text-white px-1.5 py-0.5 font-bold leading-none">✓</span>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CitizenPointsPage() {
  const [profile, setProfile] = useState<CitizenPointsProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/citoyen/points", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const earnedCodes = new Set(profile?.badges.map(b => b.badgeCode) ?? [])
  const badgeMap = Object.fromEntries(profile?.badges.map(b => [b.badgeCode, b.awardedAt]) ?? [])

  // Prochain badge à débloquer
  const nextBadge = BADGE_ORDER.filter(c => c !== "premier_pas").find(c => !earnedCodes.has(c))
  const nextThreshold = nextBadge ? BADGES[nextBadge].threshold : null

  // Badge actuel le plus haut
  const currentBadge = [...BADGE_ORDER].reverse().find(c => earnedCodes.has(c)) ?? null

  return (
    <DashboardLayout role="citoyen" pageTitle="Mes Points & Badges">
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* ── En-tête motivation ── */}
        <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-background to-blue-500/10 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="shrink-0">
              {loading
                ? <Skeleton className="w-[148px] h-[128px] rounded-full" />
                : <ProgressRing points={profile?.totalPoints ?? 0} nextThreshold={nextThreshold} currentBadge={currentBadge} />
              }
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h2 className="text-xl font-bold">
                {currentBadge ? `${BADGES[currentBadge].icon} ${BADGES[currentBadge].label}` : "Débutant 🌱"}
              </h2>
              {loading
                ? <Skeleton className="h-4 w-48" />
                : (
                  <p className="text-sm text-muted-foreground">
                    {profile
                      ? `Rang #${profile.rank} sur ${profile.totalCitizens} citoyens`
                      : "Chargement…"
                    }
                  </p>
                )
              }
              {nextBadge && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground/80 mb-1">
                    Prochain badge : <span style={{ color: BADGES[nextBadge].color }} className="font-semibold">{BADGES[nextBadge].icon} {BADGES[nextBadge].label}</span>
                    {profile && ` (encore ${Math.max(0, nextThreshold! - profile.totalPoints)} pts)`}
                  </p>
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden w-full max-w-xs">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${nextThreshold ? Math.min(100, ((profile?.totalPoints ?? 0) / nextThreshold) * 100) : 100}%`,
                        background: nextBadge ? BADGES[nextBadge].color : "#2dd4bf",
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 text-xs rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-teal-300">
                  <Trophy className="h-3 w-3" /> {earnedCodes.size} badge{earnedCodes.size > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 text-xs rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-300">
                  <Zap className="h-3 w-3" /> {profile?.totalPoints ?? 0} pts au total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Comment gagner des points ── */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" /> Comment gagner des points ?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "🌱", label: "1er signalement",               pts: "+10 pts", color: "text-green-400"  },
              { icon: "📝", label: "Chaque signalement suivant",     pts: "+5 pts",  color: "text-teal-400"   },
              { icon: "👁️",  label: "Signalement confirmé par l'IA", pts: "+10 pts", color: "text-blue-400"   },
              { icon: "🎯",  label: "Haute confiance IA",            pts: "+15 pts", color: "text-purple-400" },
              { icon: "🚨",  label: "Alerte critique confirmée",     pts: "+20 pts", color: "text-red-400"    },
              { icon: "✅",  label: "Signalement résolu",            pts: "+5 pts",  color: "text-teal-400"   },
              { icon: "🏅",  label: "Badge débloqué",                pts: "bonus",   color: "text-amber-400"  },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <span className="text-lg shrink-0">{row.icon}</span>
                <span className="flex-1 text-xs text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-bold ${row.color}`}>{row.pts}</span>
              </div>
            ))}
            <div className="sm:col-span-2 pt-1">
              <Link href="/citoyen/signaler"
                className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                Faire un signalement maintenant <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Badges ── */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" /> Mes Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">{BADGE_ORDER.map(c => <Skeleton key={c} className="h-28 rounded-xl" />)}</div>
              : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {BADGE_ORDER.map(code => (
                    <BadgeCard key={code} code={code} earned={earnedCodes.has(code)} awardedAt={badgeMap[code]} />
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* ── Mes points par quartier ── */}
        {!loading && profile && profile.quartierStats.length > 0 && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-400" /> Points par quartier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.quartierStats.map(({ quartier, points }) => {
                const max = profile.quartierStats[0].points
                const pct = Math.round((points / max) * 100)
                return (
                  <div key={quartier} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{quartier}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500/70 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-teal-400 w-14 text-right">{points} pts</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Historique ── */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Historique des points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
              : !profile || profile.history.length === 0
                ? (
                  <div className="text-center py-8 space-y-2">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">Aucun point encore.</p>
                    <Link href="/citoyen/signaler"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline">
                      Faire votre premier signalement <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )
                : (
                  <div className="divide-y divide-border/30">
                    {profile.history.map(entry => {
                      const meta = REASON_LABELS[entry.reason] ?? { label: entry.reason, color: "text-foreground" }
                      return (
                        <div key={entry.id} className="flex items-center gap-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                            {entry.quartier && (
                              <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />{entry.quartier}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-teal-400">+{entry.points}</span>
                            <p className="text-[10px] text-muted-foreground/60">{timeAgo(entry.awardedAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
            }
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
