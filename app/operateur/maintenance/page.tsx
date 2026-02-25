"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wrench, Clock, CheckCircle2, AlertTriangle, Calendar, ArrowRight } from "lucide-react"

const maintenanceTasks = [
  { id: "MT-001", asset: "Pompe #3 - Station Est", type: "Remplacement joint", priority: "Haute", dueDate: "2026-02-24", confidence: 94, status: "Urgent" },
  { id: "MT-002", asset: "Vanne #45 - Zone Industrielle", type: "Calibration", priority: "Moyenne", dueDate: "2026-02-26", confidence: 87, status: "Planifie" },
  { id: "MT-003", asset: "Capteur #112 - Reservoir Nord", type: "Nettoyage", priority: "Basse", dueDate: "2026-02-28", confidence: 72, status: "Planifie" },
  { id: "MT-004", asset: "Canalisation C12 - Secteur 5", type: "Inspection", priority: "Haute", dueDate: "2026-03-01", confidence: 68, status: "Planifie" },
  { id: "MT-005", asset: "Pompe #7 - Station Ouest", type: "Remplacement filtre", priority: "Moyenne", dueDate: "2026-03-03", confidence: 62, status: "Planifie" },
]

const priorityColors: Record<string, string> = {
  Haute: "bg-destructive/15 text-destructive border-destructive/20",
  Moyenne: "bg-warning/15 text-warning-foreground border-warning/20",
  Basse: "bg-secondary text-secondary-foreground border-border",
}

export default function MaintenancePage() {
  return (
    <DashboardLayout role="operateur" title="Maintenance Predictive">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Taches en Attente" value="12" change="3 urgentes" changeType="negative" icon={Clock} />
          <KPICard title="Completees ce Mois" value="28" change="+15% vs mois dernier" changeType="positive" icon={CheckCircle2} />
          <KPICard title="Predictions IA" value="5" change="Nouvelles cette semaine" changeType="neutral" icon={AlertTriangle} iconColor="bg-warning/15" />
          <KPICard title="Cout Evite" value="42K" change="Estimation mensuelle" changeType="positive" icon={Wrench} />
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
              {maintenanceTasks.map((task) => (
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
