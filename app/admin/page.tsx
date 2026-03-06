"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Server, Users, Cpu, Activity, Database, Shield } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"

import { useApiQuery } from "@/hooks/use-api-query"
import type { AdminDashboardData } from "@/lib/types"

const DEFAULT_DATA: AdminDashboardData = {
  kpis: {
    activeUsers: 0,
    sensors: 0,
    uptime: "0%",
    processedAlerts: 0,
  },
  systemMetrics: [],
  userActivity: [],
  sensorDistribution: [],
  security: [],
}

export default function AdminDashboard() {
  const { data } = useApiQuery<AdminDashboardData>("/api/admin/dashboard", DEFAULT_DATA)

  return (
    <DashboardLayout role="admin" title="Vue Systeme Globale">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Utilisateurs Actifs" value={`${data.kpis.activeUsers}`} change="+12% ce mois" changeType="positive" icon={Users} />
          <KPICard title="Capteurs IoT" value={`${data.kpis.sensors}`} change="Etat en temps reel" changeType="positive" icon={Cpu} />
          <KPICard title="Uptime Systeme" value={data.kpis.uptime} change="30 derniers jours" changeType="positive" icon={Server} />
          <KPICard title="Alertes Traitees" value={`${data.kpis.processedAlerts}`} change="Ce mois" changeType="neutral" icon={Activity} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="h-4 w-4 text-accent" />
                Ressources Systeme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.systemMetrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.name}</span>
                    <span className="font-medium text-foreground">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="mt-2 h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-accent" />
                Activite Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.userActivity}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="oklch(0.70 0.15 195)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Cpu className="h-4 w-4 text-accent" />
                Distribution des Capteurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.sensorDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.sensorDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {data.sensorDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="ml-auto text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="h-4 w-4 text-accent" />
                Securite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.security.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/30 px-4 py-3">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
