"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Droplets, Radio, Wrench, Activity, TrendingUp } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"

const flowData = [
  { time: "00h", debit: 1200, pression: 3.2 },
  { time: "02h", debit: 800, pression: 3.1 },
  { time: "04h", debit: 600, pression: 3.0 },
  { time: "06h", debit: 900, pression: 3.1 },
  { time: "08h", debit: 1500, pression: 3.3 },
  { time: "10h", debit: 1800, pression: 3.4 },
  { time: "12h", debit: 2000, pression: 3.2 },
  { time: "14h", debit: 1900, pression: 3.3 },
  { time: "16h", debit: 1700, pression: 3.2 },
  { time: "18h", debit: 1600, pression: 3.1 },
  { time: "20h", debit: 1400, pression: 3.2 },
  { time: "22h", debit: 1100, pression: 3.1 },
]

const alertsData = [
  { jour: "Lun", alertes: 3 },
  { jour: "Mar", alertes: 5 },
  { jour: "Mer", alertes: 2 },
  { jour: "Jeu", alertes: 7 },
  { jour: "Ven", alertes: 4 },
  { jour: "Sam", alertes: 1 },
  { jour: "Dim", alertes: 2 },
]

const recentAlerts = [
  { id: 1, type: "Fuite", location: "Bd Haussmann - Noeud #247", severity: "critique" as const, probability: "94%", time: "Il y a 12 min" },
  { id: 2, type: "Panne pompe", location: "Station Est - Pompe #3", severity: "alerte" as const, probability: "87%", time: "Il y a 45 min" },
  { id: 3, type: "Contamination", location: "Reservoir Nord - Zone C", severity: "alerte" as const, probability: "72%", time: "Il y a 1h" },
  { id: 4, type: "Fraude", location: "Secteur 12 - Compteur #891", severity: "moyen" as const, probability: "65%", time: "Il y a 2h" },
  { id: 5, type: "Fuite", location: "Rue de Rivoli - Joint #12", severity: "faible" as const, probability: "45%", time: "Il y a 3h" },
]

const sensorStatus = [
  { label: "En ligne", count: 2352, color: "bg-success" },
  { label: "Alerte", count: 38, color: "bg-warning" },
  { label: "Hors ligne", count: 10, color: "bg-destructive" },
]

export default function OperateurDashboard() {
  return (
    <DashboardLayout role="operateur" title="Tableau de Bord Operateur">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Fuites Detectees"
            value="12"
            change="-3 vs semaine derniere"
            changeType="positive"
            icon={Droplets}
          />
          <KPICard
            title="Alertes Actives"
            value="8"
            change="2 critiques"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="bg-warning/15"
          />
          <KPICard
            title="Sante Reseau"
            value="94.2%"
            change="+1.3% ce mois"
            changeType="positive"
            icon={Activity}
          />
          <KPICard
            title="Capteurs Actifs"
            value="2,352"
            change="98% disponibilite"
            changeType="positive"
            icon={Radio}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Flow Chart */}
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
                <AreaChart data={flowData}>
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

          {/* Sensor Status + Alerts Bar Chart */}
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Etat des Capteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sensorStatus.map((status) => (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <span className="text-sm text-foreground">{status.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{status.count}</span>
                  </div>
                ))}
                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-secondary">
                  <div className="bg-success" style={{ width: "98%" }} />
                  <div className="bg-warning" style={{ width: "1.5%" }} />
                  <div className="bg-destructive" style={{ width: "0.5%" }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Alertes / Semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={alertsData}>
                    <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="alertes" fill="oklch(0.70 0.15 195)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real-time Alerts Panel */}
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
              {recentAlerts.map((alert) => (
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
