"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Search, Plus, MoreHorizontal, Cpu, Wifi, WifiOff, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useMemo, useState } from "react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { SensorItem } from "@/lib/types"

interface DevicesResponse {
  stats: {
    total: number
    online: number
    offline: number
    updateRequired: number
  }
  items: SensorItem[]
}

const DEFAULT_DATA: DevicesResponse = {
  stats: {
    total: 0,
    online: 0,
    offline: 0,
    updateRequired: 0,
  },
  items: [],
}

export default function AdminCapteursPage() {
  const [search, setSearch] = useState("")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const suffix = params.toString()
    return `/api/admin/capteurs${suffix ? `?${suffix}` : ""}`
  }, [search])

  const { data, setData } = useApiQuery<DevicesResponse>(query, DEFAULT_DATA)

  async function handleToggle(deviceId: string, enabled: boolean) {
    setData((previous) => ({
      ...previous,
      items: previous.items.map((device) => (device.id === deviceId ? { ...device, enabled, status: enabled ? "actif" : "inactif" } : device)),
    }))

    await fetch("/api/admin/capteurs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: deviceId, enabled }),
    })
  }

  return (
    <DashboardLayout role="admin" title="Gestion des Capteurs IoT">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Cpu className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Capteurs</p>
                <p className="text-xl font-bold text-foreground">{data.stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Wifi className="h-8 w-8 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">En Ligne</p>
                <p className="text-xl font-bold text-foreground">{data.stats.online}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <WifiOff className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Hors Ligne</p>
                <p className="text-xl font-bold text-foreground">{data.stats.offline}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Settings className="h-8 w-8 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">MAJ Requise</p>
                <p className="text-xl font-bold text-foreground">{data.stats.updateRequired}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Inventaire des Capteurs</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher un capteur..." className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Modele</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-xs">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{device.model}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{device.firmware}</TableCell>
                    <TableCell className="text-sm">{device.sector}</TableCell>
                    <TableCell><StatusBadge status={device.status} /></TableCell>
                    <TableCell>
                      <Switch checked={Boolean(device.enabled)} onCheckedChange={(checked) => handleToggle(device.id, checked)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
