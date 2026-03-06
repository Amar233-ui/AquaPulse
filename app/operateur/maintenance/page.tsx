"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wrench, Clock, CheckCircle2, AlertTriangle, Calendar, ArrowRight } from "lucide-react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { MaintenanceTask } from "@/lib/types"

interface MaintenanceResponse {
  stats: {
    pending: number
    completedThisMonth: number
    aiPredictions: number
    avoidedCost: number
  }
  items: MaintenanceTask[]
}

const DEFAULT_DATA: MaintenanceResponse = {
  stats: {
    pending: 0,
    completedThisMonth: 0,
    aiPredictions: 0,
    avoidedCost: 0,
  },
  items: [],
}

const priorityColors: Record<string, string> = {
  Haute: "bg-destructive/15 text-destructive border-destructive/20",
  Moyenne: "bg-warning/15 text-warning-foreground border-warning/20",
  Basse: "bg-secondary text-secondary-foreground border-border",
}

export default function MaintenancePage() {
  const { data } = useApiQuery<MaintenanceResponse>("/api/operateur/maintenance", DEFAULT_DATA)

  return (
    <DashboardLayout role="operateur" title="Maintenance Predictive">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Taches en Attente" value={`${data.stats.pending}`} change="Prioriser les urgences" changeType="negative" icon={Clock} />
          <KPICard title="Completees ce Mois" value={`${data.stats.completedThisMonth}`} change="Execution terrain" changeType="positive" icon={CheckCircle2} />
          <KPICard title="Predictions IA" value={`${data.stats.aiPredictions}`} change="Nouvelles cette semaine" changeType="neutral" icon={AlertTriangle} iconColor="bg-warning/15" />
          <KPICard title="Cout Evite" value={`${data.stats.avoidedCost}K`} change="Estimation mensuelle" changeType="positive" icon={Wrench} />
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Plan de Maintenance Predictive</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Calendrier
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.items.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 rounded-lg border border-border/40 bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      {task.status === "Urgent" && (
                        <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{task.asset}</p>
                    <p className="text-xs text-muted-foreground">{task.type}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Confiance IA</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={task.confidence} className="h-1.5 w-20" />
                        <span className="text-xs font-medium text-foreground">{task.confidence}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Echeance</p>
                      <p className="text-sm font-medium text-foreground">{task.dueDate}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Detail <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
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
