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

const iotDevices = [
  { id: "IOT-001", name: "Debitmitre UltraFlow", model: "UF-2000", firmware: "v3.2.1", sector: "Nord", status: "actif" as const, enabled: true },
  { id: "IOT-002", name: "Capteur Pression SmartP", model: "SP-100", firmware: "v2.8.4", sector: "Est", status: "actif" as const, enabled: true },
  { id: "IOT-003", name: "Sonde Qualite AquaQ", model: "AQ-500", firmware: "v4.1.0", sector: "Nord", status: "alerte" as const, enabled: true },
  { id: "IOT-004", name: "Thermometre IoT TempX", model: "TX-300", firmware: "v1.9.2", sector: "Centre", status: "actif" as const, enabled: true },
  { id: "IOT-005", name: "Capteur Acoustique NoiseD", model: "ND-800", firmware: "v2.5.3", sector: "Sud", status: "actif" as const, enabled: true },
  { id: "IOT-006", name: "Compteur Intelligent MeterI", model: "MI-400", firmware: "v3.0.0", sector: "Ouest", status: "inactif" as const, enabled: false },
  { id: "IOT-007", name: "Sonde Niveau NiveauS", model: "NS-200", firmware: "v2.1.7", sector: "Zone Ind.", status: "actif" as const, enabled: true },
]

export default function AdminCapteursPage() {
  return (
    <DashboardLayout role="admin" title="Gestion des Capteurs IoT">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Cpu className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Capteurs</p>
                <p className="text-xl font-bold text-foreground">2,400</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Wifi className="h-8 w-8 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">En Ligne</p>
                <p className="text-xl font-bold text-foreground">2,352</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <WifiOff className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Hors Ligne</p>
                <p className="text-xl font-bold text-foreground">48</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Settings className="h-8 w-8 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">MAJ Requise</p>
                <p className="text-xl font-bold text-foreground">15</p>
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
                <Input placeholder="Rechercher un capteur..." className="pl-8" />
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
                {iotDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-xs">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{device.model}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{device.firmware}</TableCell>
                    <TableCell className="text-sm">{device.sector}</TableCell>
                    <TableCell><StatusBadge status={device.status} /></TableCell>
                    <TableCell><Switch checked={device.enabled} /></TableCell>
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
