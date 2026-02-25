"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Thermometer, Activity, AlertTriangle, MessageSquareWarning, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

const waterQualityIndicators = [
  { label: "pH", value: "7.2", status: "normal" as const, target: "6.5 - 8.5" },
  { label: "Turbidite", value: "0.8 NTU", status: "normal" as const, target: "< 1 NTU" },
  { label: "Chlore residuel", value: "0.5 mg/L", status: "normal" as const, target: "0.2 - 0.8 mg/L" },
  { label: "Contamination", value: "0 CFU", status: "normal" as const, target: "0 CFU/100mL" },
]

const recentAlerts = [
  { id: 1, message: "Maintenance preventive - Secteur Nord", time: "Il y a 2h", type: "alerte" as const },
  { id: 2, message: "Qualite eau excellente - Zone Centre", time: "Il y a 5h", type: "normal" as const },
  { id: 3, message: "Debit anormal detecte - Rue de la Paix", time: "Il y a 8h", type: "alerte" as const },
]

export default function CitoyenDashboard() {
  return (
    <DashboardLayout role="citoyen" title="Tableau de Bord Citoyen">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Qualite Globale"
            value="Excellente"
            change="+2.3% ce mois"
            changeType="positive"
            icon={Droplets}
          />
          <KPICard
            title="Temperature"
            value="18.5 C"
            change="Stable"
            changeType="neutral"
            icon={Thermometer}
          />
          <KPICard
            title="Etat du Reseau"
            value="Normal"
            change="Aucune alerte critique"
            changeType="positive"
            icon={Activity}
          />
          <KPICard
            title="Alertes Actives"
            value="2"
            change="En cours de traitement"
            changeType="neutral"
            icon={AlertTriangle}
            iconColor="bg-warning/15"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Water Quality */}
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">{"Qualite de l'Eau"}</CardTitle>
              <Link href="/citoyen/qualite" className="text-sm font-medium text-accent hover:underline">
                {"Voir le detail"}
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {waterQualityIndicators.map((indicator) => (
                  <div key={indicator.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{indicator.label}</p>
                      <p className="mt-1 text-lg font-bold text-foreground">{indicator.value}</p>
                      <p className="text-xs text-muted-foreground">{"Cible: "}{indicator.target}</p>
                    </div>
                    <StatusBadge status={indicator.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Etat du Reseau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sante globale</span>
                    <span className="font-medium text-foreground">94%</span>
                  </div>
                  <Progress value={94} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capteurs actifs</span>
                    <span className="font-medium text-foreground">98%</span>
                  </div>
                  <Progress value={98} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pression moyenne</span>
                    <span className="font-medium text-foreground">87%</span>
                  </div>
                  <Progress value={87} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            <Button asChild className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
              <Link href="/citoyen/signaler">
                <MessageSquareWarning className="h-4 w-4" />
                Signaler un Probleme
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Alerts */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Activite Recente</CardTitle>
            <Link href="/citoyen/reseau" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={alert.type} />
                    <span className="text-sm text-foreground">{alert.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
