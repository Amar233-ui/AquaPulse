"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, WifiOff } from "lucide-react"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenNetworkSector } from "@/lib/types"

const DEFAULT_SECTORS: { sectors: CitizenNetworkSector[] } = {
  sectors: [],
}

const statusLabel: Record<string, string> = {
  normal:   "Normal",
  alerte:   "En alerte",
  critique: "Critique",
}

export default function ReseauPage() {
  const { data, loading, error } = useApiQuery("/api/citoyen/reseau", DEFAULT_SECTORS)

  return (
    <DashboardLayout role="citoyen" title="État du Réseau">
      <div className="space-y-6">

        {/* Résumé global */}
        {!loading && data.sectors.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Secteurs normaux",
                count: data.sectors.filter(s => s.status === "normal").length,
                color: "text-teal-400",
                bg: "bg-teal-500/10 border-teal-500/25",
              },
              {
                label: "En alerte",
                count: data.sectors.filter(s => s.status === "alerte").length,
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/25",
              },
              {
                label: "Critiques",
                count: data.sectors.filter(s => s.status === "critique").length,
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/25",
              },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 text-center ${item.bg}`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs text-foreground/60 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* États */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-6 py-8 text-center">
            <WifiOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-red-300">Impossible de charger les données</p>
            <p className="text-sm text-foreground/65 mt-1">{error}</p>
          </div>
        ) : data.sectors.length === 0 ? (
          <div className="rounded-xl border border-teal-500/25 bg-teal-950/20 px-6 py-8 text-center">
            <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
            <p className="font-semibold text-teal-300">Données réseau indisponibles</p>
            <p className="text-sm text-foreground/65 mt-1">Aucun secteur configuré pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.sectors.map((sector) => (
              <Card
                key={sector.name}
                className={`border shadow-sm ${
                  sector.status === "critique" ? "border-red-500/30 bg-red-950/10"
                  : sector.status === "alerte"  ? "border-orange-500/30 bg-orange-950/10"
                  : "border-border/60"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">{sector.name}</CardTitle>
                  <StatusBadge status={sector.status} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Santé</span>
                      <span className={`font-semibold ${
                        sector.health >= 80 ? "text-teal-400"
                        : sector.health >= 60 ? "text-orange-400"
                        : "text-red-400"
                      }`}>{sector.health}%</span>
                    </div>
                    <Progress
                      value={sector.health}
                      className="h-1.5"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capteurs actifs</span>
                    <span className="font-medium text-foreground">{sector.sensors}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pression</span>
                    <span className="font-medium text-foreground">{sector.pressure}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">État</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      sector.status === "normal"   ? "bg-teal-500/15 text-teal-400"
                      : sector.status === "alerte" ? "bg-orange-500/15 text-orange-400"
                      : "bg-red-500/15 text-red-400"
                    }`}>
                      {statusLabel[sector.status] ?? sector.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
