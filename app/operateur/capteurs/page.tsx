"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Wifi, WifiOff, Battery, Signal } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useMemo, useState } from "react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { SensorItem } from "@/lib/types"

interface SensorsResponse {
  stats: {
    online: number
    lowBattery: number
    offline: number
  }
  items: SensorItem[]
}

const DEFAULT_DATA: SensorsResponse = {
  stats: {
    online: 0,
    lowBattery: 0,
    offline: 0,
  },
  items: [],
}

export default function CapteursPage() {
  const [search, setSearch] = useState("")
  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const suffix = params.toString()
    return `/api/operateur/capteurs${suffix ? `?${suffix}` : ""}`
  }, [search])

  const { data } = useApiQuery<SensorsResponse>(query, DEFAULT_DATA)

  return (
    <DashboardLayout role="operateur" title="Monitoring des Capteurs">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                <Wifi className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Ligne</p>
                <p className="text-2xl font-bold text-foreground">{data.stats.online}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
                <Battery className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batterie Faible</p>
                <p className="text-2xl font-bold text-foreground">{data.stats.lowBattery}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                <WifiOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hors Ligne</p>
                <p className="text-2xl font-bold text-foreground">{data.stats.offline}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Liste des Capteurs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un capteur..."
                className="pl-8"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Batterie</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Derniere MAJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell className="font-mono text-xs">{sensor.id}</TableCell>
                    <TableCell className="font-medium">{sensor.type}</TableCell>
                    <TableCell className="text-muted-foreground">{sensor.location}</TableCell>
                    <TableCell><StatusBadge status={sensor.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={sensor.battery} className="h-1.5 w-16" />
                        <span className="text-xs">{sensor.battery}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{sensor.signal}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sensor.lastUpdate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
