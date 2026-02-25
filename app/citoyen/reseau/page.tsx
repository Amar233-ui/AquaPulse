"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Progress } from "@/components/ui/progress"

const sectors = [
  { name: "Secteur Nord", status: "normal" as const, health: 96, sensors: 42, pressure: "3.2 bar" },
  { name: "Secteur Sud", status: "normal" as const, health: 94, sensors: 38, pressure: "3.1 bar" },
  { name: "Secteur Est", status: "alerte" as const, health: 78, sensors: 35, pressure: "2.8 bar" },
  { name: "Secteur Ouest", status: "normal" as const, health: 92, sensors: 40, pressure: "3.0 bar" },
  { name: "Centre-Ville", status: "normal" as const, health: 97, sensors: 55, pressure: "3.4 bar" },
  { name: "Zone Industrielle", status: "alerte" as const, health: 82, sensors: 28, pressure: "2.9 bar" },
]

export default function ReseauPage() {
  return (
    <DashboardLayout role="citoyen" title="Etat du Reseau">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector) => (
            <Card key={sector.name} className="border border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">{sector.name}</CardTitle>
                <StatusBadge status={sector.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sante</span>
                    <span className="font-medium text-foreground">{sector.health}%</span>
                  </div>
                  <Progress value={sector.health} className="mt-1.5 h-1.5" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capteurs actifs</span>
                  <span className="font-medium text-foreground">{sector.sensors}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pression</span>
                  <span className="font-medium text-foreground">{sector.pressure}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
