"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Droplets, Radio, Activity, TrendingUp } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"
import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorDashboardData } from "@/lib/types"

// Données de démo non-nulles — affichées si l'API ne répond pas
const DEFAULT_DATA: OperatorDashboardData = {
  kpis: {
    leakDetections: 4,
    activeAlerts: 7,
    criticalAlerts: 2,
    networkHealth: 87,
    activeSensors: 38,
    availabilityRate: 93,
  },
  flowData: [
    { time: "00h", debit: 1820, pression: 3.2 },
    { time: "03h", debit: 1640, pression: 3.4 },
    { time: "06h", debit: 2100, pression: 3.1 },
    { time: "09h", debit: 2850, pression: 2.9 },
    { time: "12h", debit: 3100, pression: 2.7 },
    { time: "15h", debit: 2950, pression: 2.8 },
    { time: "18h", debit: 3200, pression: 2.6 },
    { time: "21h", debit: 2600, pression: 3.0 },
    { time: "24h", debit: 2100, pression: 3.2 },
  ],
  alertsData: [
    { jour: "Lun", alertes: 3 },
    { jour: "Mar", alertes: 5 },
    { jour: "Mer", alertes: 2 },
    { jour: "Jeu", alertes: 7 },
    { jour: "Ven", alertes: 4 },
    { jour: "Sam", alertes: 6 },
    { jour: "Dim", alertes: 7 },
  ],
  recentAlerts: [
    { id: "ALT-001", severity: "critique", type: "Fuite détectée",    location: "Grand Dakar — J1-J2",    probability: "94%", time: "Il y a 45 min" },
    { id: "ALT-002", severity: "critique", type: "Panne pompe",       location: "Station Fann — P1",       probability: "91%", time: "Il y a 1h10" },
    { id: "ALT-003", severity: "alerte",   type: "Débit anormal",     location: "Canalisation Fann-Plateau", probability: "78%", time: "Il y a 1h30" },
    { id: "ALT-004", severity: "alerte",   type: "Pression basse",    location: "Zone Grand Dakar",         probability: "65%", time: "Il y a 2h" },
  ],
  sensorStatus: [
    { label: "Normal",    count: 33, color: "bg-emerald-500" },
    { label: "En alerte", count: 4,  color: "bg-amber-500"   },
    { label: "Critique",  count: 4,  color: "bg-red-500"     },
  ],
}

export default function OperateurDashboard() {
  const { data } = useApiQuery<OperatorDashboardData>("/api/operateur/dashboard", DEFAULT_DATA)
  const sensorTotal = data.sensorStatus.reduce((sum, s) => sum + s.count, 0)

  return (
    <DashboardLayout role="operateur" title="Tableau de Bord Opérateur">
      <div className="space-y-6">

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Fuites Détectées"
            value={`${data.kpis.leakDetections}`}
            change="Détectées par IA"
            changeType="positive"
            icon={Droplets}
          />
          <KPICard
            title="Alertes Actives"
            value={`${data.kpis.activeAlerts}`}
            change={`${data.kpis.criticalAlerts} critiques`}
            changeType={data.kpis.criticalAlerts > 0 ? "negative" : "neutral"}
            icon={AlertTriangle}
            iconColor="bg-warning/15"
          />
          <KPICard
            title="Santé Réseau"
            value={`${data.kpis.networkHealth}%`}
            change="Moyenne multi-secteurs"
            changeType="positive"
            icon={Activity}
          />
          <KPICard
            title="Capteurs Actifs"
            value={`${data.kpis.activeSensors}`}
            change={`${data.kpis.availabilityRate}% disponibilité`}
            changeType="positive"
            icon={Radio}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Graphique débit/pression */}
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Débit & Pression (24h)</CardTitle>
              <div className="flex items-center gap-4 text-xs text-foreground/60">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Débit (m³/h)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Pression (bar)
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.flowData}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.78 0.02 230)" }} />
                  <YAxis yAxisId="debit" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.78 0.02 230)" }} />
                  <YAxis yAxisId="pression" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.78 0.02 230)" }} domain={[2.5, 4]} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.18 0.02 240)", border: "1px solid oklch(0.28 0.03 240)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "oklch(0.95 0.01 230)", fontWeight: 600 }}
                  />
                  <Area yAxisId="debit" type="monotone" dataKey="debit" stroke="oklch(0.70 0.15 195)" fill="url(#flowGrad)" strokeWidth={2} />
                  <Area yAxisId="pression" type="monotone" dataKey="pression" stroke="oklch(0.45 0.15 240)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* État capteurs */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">État des Capteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.sensorStatus.map(status => (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <span className="text-sm text-foreground/85">{status.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{status.count}</span>
                  </div>
                ))}
                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-secondary">
                  {data.sensorStatus.map(status => {
                    const width = sensorTotal > 0 ? `${(status.count / sensorTotal) * 100}%` : "0%"
                    return <div key={status.label} className={status.color} style={{ width }} />
                  })}
                </div>
                <p className="text-xs text-foreground/55 text-center pt-1">{sensorTotal} capteurs au total</p>
              </CardContent>
            </Card>

            {/* Alertes semaine */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Alertes / Semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data.alertsData}>
                    <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.78 0.02 230)" }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.18 0.02 240)", border: "1px solid oklch(0.28 0.03 240)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="alertes" fill="oklch(0.70 0.15 195)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alertes temps réel */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              Alertes Temps Réel
            </CardTitle>
            <Link href="/operateur/alertes" className="text-sm font-medium text-accent hover:underline">
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentAlerts.map(alert => (
                <div key={alert.id} className="flex flex-col gap-2 rounded-lg border border-border/40 bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <span className="text-sm font-semibold text-foreground">{alert.type}</span>
                    <span className="text-sm text-foreground/70">{alert.location}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {alert.probability}
                    </div>
                    <span className="text-xs text-foreground/55">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
