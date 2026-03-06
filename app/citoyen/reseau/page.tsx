"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Progress } from "@/components/ui/progress"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenNetworkSector } from "@/lib/types"

const DEFAULT_SECTORS: { sectors: CitizenNetworkSector[] } = {
  sectors: [],
}

export default function ReseauPage() {
  const { data } = useApiQuery("/api/citoyen/reseau", DEFAULT_SECTORS)

  return (
    <DashboardLayout role="citoyen" title="Etat du Reseau">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.sectors.map((sector) => (
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
