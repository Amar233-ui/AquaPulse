"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenQualityData } from "@/lib/types"
import { MapPin, ChevronDown } from "lucide-react"

const QUARTIERS = [
  "Plateau", "Médina", "Fann", "HLM",
  "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye", "Rufisque",
]

const STORAGE_KEY = "aqp_citoyen_quartier"

const DEFAULT_QUALITY: CitizenQualityData = {
  phData: [],
  turbidityData: [],
  parameters: [],
}

const statusColor: Record<string, string> = {
  normal:   "text-teal-400",
  alerte:   "text-orange-400",
  critique: "text-red-400",
}

export default function QualitePage() {
  const [quartier, setQuartier] = useState("Plateau")

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

  // La page qualité utilise les métriques globales (quality_readings),
  // mais on passe le quartier pour un affichage cohérent
  const { data, loading } = useApiQuery<CitizenQualityData>("/api/citoyen/qualite", DEFAULT_QUALITY)

  return (
    <DashboardLayout role="citoyen" title="Qualité de l'eau">
      <div className="space-y-6">

        {/* Sélecteur quartier — cohérence avec la page accueil */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-semibold text-foreground">Secteur affiché :</span>
          </div>
          <div className="relative">
            <select
              value={quartier}
              onChange={e => handleQuartierChange(e.target.value)}
              className="appearance-none rounded-xl border border-teal-500/30 bg-teal-500/10 pl-4 pr-10 py-2 text-sm font-semibold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
            >
              {QUARTIERS.map(q => (
                <option key={q} value={q} className="bg-card text-foreground">{q}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
          </div>
          <span className="text-xs text-foreground/50">Données issues des capteurs du réseau — {quartier}</span>
        </div>

        {/* Paramètres */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.parameters.map((param) => (
              <Card
                key={param.label}
                className={`border shadow-sm ${
                  param.status === "critique" ? "border-red-500/30 bg-red-950/10"
                  : param.status === "alerte"  ? "border-orange-500/30 bg-orange-950/10"
                  : "border-teal-500/20 bg-teal-950/10"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{param.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${statusColor[param.status] ?? "text-foreground"}`}>
                        {param.value}{" "}
                        <span className="text-sm font-normal text-muted-foreground">{param.unit}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Norme&nbsp;: {param.min}
                        {param.max && param.max !== param.min ? ` – ${param.max}` : ""}
                        {param.unit ? ` ${param.unit}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={param.status} />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{param.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Graphiques */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Évolution du pH (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.phData}>
                    <defs>
                      <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis domain={[6.5, 8.5]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.70 0.15 195)" fill="url(#phGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Évolution de la Turbidité (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.turbidityData}>
                    <defs>
                      <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.45 0.15 240)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.45 0.15 240)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 2]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.45 0.15 240)" fill="url(#turbGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
