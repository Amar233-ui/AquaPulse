"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle, Droplets, Radio, Activity, TrendingUp,
  MessageSquareWarning, Zap, CheckCircle2, Clock, ArrowRight, Gauge, BarChart3
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"
import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorDashboardData } from "@/lib/types"
import { useState, useEffect } from "react"

const EMPTY_DATA: OperatorDashboardData = {
  kpis: { leakDetections:0, activeAlerts:0, criticalAlerts:0, networkHealth:0, activeSensors:0, availabilityRate:0 },
  flowData: [], alertsData: [], recentAlerts: [], sensorStatus: [],
}

const ZONE_PRESSURES = [
  { zone: "Plateau",    pressure: 3.4, status: "normal"   },
  { zone: "Médina",     pressure: 2.1, status: "alerte"   },
  { zone: "Fann",       pressure: 1.8, status: "critique" },
  { zone: "HLM",        pressure: 3.1, status: "normal"   },
  { zone: "Gd Dakar",   pressure: 2.9, status: "normal"   },
  { zone: "Parcelles",  pressure: 3.2, status: "normal"   },
]

const REQUIRED_ACTIONS = [
  { id:1, type:"signalement", label:"Fuite signalée rue Moussé Diop",  time:"5 min",  urgency:"high",   href:"/operateur/signalements" },
  { id:2, type:"alerte",      label:"Pression critique zone Fann",      time:"12 min", urgency:"high",   href:"/operateur/alertes" },
  { id:3, type:"maintenance", label:"Pompe P1 — inspection échéance",   time:"2h",     urgency:"medium", href:"/operateur/maintenance" },
  { id:4, type:"signalement", label:"Odeur suspecte Médina",            time:"1h",     urgency:"medium", href:"/operateur/signalements" },
  { id:5, type:"capteur",     label:"Capteur S-042 hors ligne",         time:"3h",     urgency:"low",    href:"/operateur/capteurs" },
]

function LiveClock() {
  const [t, setT] = useState("")
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", second:"2-digit" }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-xs text-muted-foreground tabular-nums">{t}</span>
}

export default function OperateurDashboard() {
  const { data, loading } = useApiQuery<OperatorDashboardData>("/api/operateur/dashboard", EMPTY_DATA)
  const { data: sigData } = useApiQuery<{summary:{nouveau:number}}>("/api/operateur/signalements", { summary:{ nouveau:0 } })
  const sensorTotal = data.sensorStatus.reduce((sum, s) => sum + s.count, 0)
  const nouveauxSig = sigData?.summary?.nouveau ?? 0

  if (loading) return (
    <DashboardLayout role="operateur" title="Centre de Contrôle">
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({length:4}).map((_,i)=>(
            <Card key={i} className="border border-border/60"><CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-24"/><Skeleton className="h-7 w-14"/><Skeleton className="h-3 w-32"/>
            </CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl"/>
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
          <Skeleton className="h-[200px] rounded-xl"/><Skeleton className="h-[200px] rounded-xl lg:col-span-2"/>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="operateur" title="Centre de Contrôle">
      <div className="space-y-4">

        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"/>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400"/>
            </span>
            <span className="text-sm font-medium text-foreground/80">Réseau opérationnel</span>
            {data.kpis.criticalAlerts > 0 && (
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 text-xs gap-1">
                <AlertTriangle className="h-3 w-3"/> {data.kpis.criticalAlerts} critique{data.kpis.criticalAlerts > 1 ? "s" : ""}
              </Badge>
            )}
            {nouveauxSig > 0 && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs gap-1">
                <MessageSquareWarning className="h-3 w-3"/> {nouveauxSig} signalement{nouveauxSig > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <LiveClock/>
        </div>

        {/* KPIs — 2 cols mobile, 4 desktop */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <KPICard title="Fuites Détectées" value={`${data.kpis.leakDetections}`}
            change="Détectées par IA" changeType="positive" icon={Droplets}/>
          <KPICard title="Alertes Actives" value={`${data.kpis.activeAlerts}`}
            change={`${data.kpis.criticalAlerts} critiques`}
            changeType={data.kpis.criticalAlerts > 0 ? "negative" : "neutral"} icon={AlertTriangle} iconColor="bg-warning/15"/>
          <KPICard title="Santé Réseau" value={`${data.kpis.networkHealth}%`}
            change="Moyenne multi-secteurs" changeType="positive" icon={Activity}/>
          <KPICard title="Capteurs Actifs" value={`${data.kpis.activeSensors}`}
            change={`${data.kpis.availabilityRate}% disponibilité`} changeType="positive" icon={Radio}/>
        </div>

        {/* Chart + Pression — stack mobile, grid desktop */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground"/>
                Débit & Pression — 24h
              </CardTitle>
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-accent inline-block"/>Débit</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-primary inline-block"/>Pression</span>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.flowData}>
                  <defs>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}} interval="preserveStartEnd"/>
                  <YAxis yAxisId="d" axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}} width={32}/>
                  <YAxis yAxisId="p" orientation="right" axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}} domain={[2.5,4]} width={28}/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:11}}
                    labelStyle={{color:"hsl(var(--foreground))",fontWeight:600}}/>
                  <Area yAxisId="d" type="monotone" dataKey="debit" stroke="oklch(0.70 0.15 195)" fill="url(#gF)" strokeWidth={2} dot={false} name="Débit m³/h"/>
                  <Area yAxisId="p" type="monotone" dataKey="pression" stroke="oklch(0.45 0.15 240)" fill="none" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Pression bar"/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground"/>
                Pression par Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {ZONE_PRESSURES.map(z => {
                const pct = Math.round((z.pressure / 5) * 100)
                const barC = z.status === "critique" ? "bg-red-500" : z.status === "alerte" ? "bg-amber-500" : "bg-green-500"
                const txtC = z.status === "critique" ? "text-red-400" : z.status === "alerte" ? "text-amber-400" : "text-green-400"
                return (
                  <div key={z.zone}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground/80 truncate">{z.zone}</span>
                      <span className={`font-semibold tabular-nums shrink-0 ml-2 ${txtC}`}>{z.pressure} bar</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${barC}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                )
              })}
              <p className="text-[10px] text-muted-foreground pt-1">Seuil min. recommandé : 2.5 bar</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions + Live feed — stack mobile, grid desktop */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

          {/* Actions requises */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400"/>
                </span>
                Actions Requises
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/5">
                {REQUIRED_ACTIONS.filter(a=>a.urgency==="high").length} urgents
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {REQUIRED_ACTIONS.map(a => {
                const borderC = a.urgency==="high" ? "border-l-red-500" : a.urgency==="medium" ? "border-l-amber-500" : "border-l-slate-500"
                const icon = a.type==="signalement" ? <MessageSquareWarning className="h-3.5 w-3.5 text-muted-foreground"/>
                  : a.type==="alerte" ? <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground"/>
                  : a.type==="maintenance" ? <Zap className="h-3.5 w-3.5 text-muted-foreground"/>
                  : <Radio className="h-3.5 w-3.5 text-muted-foreground"/>
                return (
                  <Link key={a.id} href={a.href}>
                    <div className={`flex items-center gap-3 rounded-lg border-l-2 ${borderC} border border-l-[3px] bg-secondary/20 border-border/30 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer`}>
                      <div className="shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5"/> {a.time}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          {/* Live feed */}
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"/>
                </span>
                Flux Temps Réel
              </CardTitle>
              <div className="flex items-center gap-3">
                <Link href="/operateur/alertes" className="text-xs text-muted-foreground hover:text-accent transition-colors">Alertes →</Link>
                <Link href="/operateur/signalements" className="text-xs text-muted-foreground hover:text-accent transition-colors">Signalements →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Zap className="h-3.5 w-3.5 text-primary"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={alert.severity}/>
                      <span className="text-xs font-medium text-foreground truncate">{alert.type}</span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5"/> {alert.probability}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/80 self-start sm:self-center shrink-0">IA</Badge>
                </div>
              ))}

              {nouveauxSig > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
                    <MessageSquareWarning className="h-3.5 w-3.5 text-amber-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-amber-400">{nouveauxSig} signalement{nouveauxSig > 1 ? "s" : ""} citoyen{nouveauxSig > 1 ? "s" : ""} non traité{nouveauxSig > 1 ? "s" : ""}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">En attente de prise en charge</p>
                  </div>
                  <Link href="/operateur/signalements">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-amber-400 hover:bg-amber-500/10 shrink-0">
                      Traiter <ArrowRight className="h-3 w-3 ml-1"/>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Sensor bar */}
              <div className="border-t border-border/40 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">État Capteurs</p>
                  <span className="text-[10px] text-muted-foreground">{sensorTotal} au total</span>
                </div>
                <div className="flex flex-wrap gap-3 mb-2">
                  {data.sensorStatus.map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.color}`}/>
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                      <span className="text-xs font-semibold text-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
                  {data.sensorStatus.map(s => (
                    <div key={s.label} className={s.color} style={{width:sensorTotal>0?`${(s.count/sensorTotal)*100}%`:"0%"}}/>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}
