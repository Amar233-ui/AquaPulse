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

const DEFAULT_DATA: OperatorDashboardData = {
  kpis: {
    leakDetections: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    networkHealth: 0,
    activeSensors: 0,
    availabilityRate: 0,
  },
  flowData: [],
  alertsData: [],
  recentAlerts: [],
  sensorStatus: [],
}

export default function OperateurDashboard() {
  const { data } = useApiQuery<OperatorDashboardData>("/api/operateur/dashboard", DEFAULT_DATA)
  const sensorTotal = data.sensorStatus.reduce((sum, status) => sum + status.count, 0)

  return (
    <DashboardLayout role="operateur" title="Tableau de Bord Operateur">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Fuites Detectees"
            value={`${data.kpis.leakDetections}`}
            change="Detectees par IA"
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
            title="Sante Reseau"
            value={`${data.kpis.networkHealth}%`}
            change="Moyenne multi-secteurs"
            changeType="positive"
            icon={Activity}
          />
          <KPICard
            title="Capteurs Actifs"
            value={`${data.kpis.activeSensors}`}
            change={`${data.kpis.availabilityRate}% disponibilite`}
            changeType="positive"
            icon={Radio}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Debit & Pression (24h)</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Debit (m3/h)
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
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="debit" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pression" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={[2.5, 4]} />
                  <Tooltip />
                  <Area yAxisId="debit" type="monotone" dataKey="debit" stroke="oklch(0.70 0.15 195)" fill="url(#flowGrad)" strokeWidth={2} />
                  <Area yAxisId="pression" type="monotone" dataKey="pression" stroke="oklch(0.45 0.15 240)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Etat des Capteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.sensorStatus.map((status) => (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <span className="text-sm text-foreground">{status.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{status.count}</span>
                  </div>
                ))}
                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-secondary">
                  {data.sensorStatus.map((status) => {
                    const width = sensorTotal > 0 ? `${(status.count / sensorTotal) * 100}%` : "0%"
                    return <div key={status.label} className={status.color} style={{ width }} />
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Alertes / Semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data.alertsData}>
                    <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="alertes" fill="oklch(0.70 0.15 195)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              Alertes Temps Reel
            </CardTitle>
            <Link href="/operateur/alertes" className="text-sm font-medium text-accent hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-2 rounded-lg border border-border/40 bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <span className="text-sm font-medium text-foreground">{alert.type}</span>
                    <span className="text-sm text-muted-foreground">{alert.location}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {alert.probability}
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
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
