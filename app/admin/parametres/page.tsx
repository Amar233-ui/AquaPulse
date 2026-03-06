"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Save, Bell, Shield, Database, Globe } from "lucide-react"
import { useEffect, useState } from "react"

import { useApiQuery } from "@/hooks/use-api-query"
import type { AppSettings } from "@/lib/types"

const DEFAULT_SETTINGS: AppSettings = {
  orgName: "Ville de Paris - Service des Eaux",
  timezone: "europe-paris",
  apiKey: "aqp_sk_*****************************",
  notifications: {
    criticalEmail: true,
    dailyReport: true,
    predictiveMaintenance: true,
    citizenReports: false,
  },
  security: {
    require2FA: true,
    sessionExpiry: "8h",
    auditLogs: true,
  },
  database: {
    autoBackup: true,
    retentionPeriod: "1y",
  },
}

export default function ParametresPage() {
  const { data } = useApiQuery<AppSettings>("/api/admin/parametres", DEFAULT_SETTINGS)
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(data)
  }, [data])

  async function saveSettings() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })

      const json = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(json.error ?? "Sauvegarde impossible")
      }

      setMessage("Parametres sauvegardes.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin" title="Parametres">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Globe className="h-4 w-4 text-accent" />
              Parametres Generaux
            </CardTitle>
            <CardDescription>Configuration generale de la plateforme AquaPulse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nom de l&apos;Organisation</Label>
                <Input id="orgName" value={form.orgName} onChange={(event) => setForm({ ...form, orgName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau Horaire</Label>
                <Select value={form.timezone} onValueChange={(value) => setForm({ ...form, timezone: value })}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                    <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                    <SelectItem value="us-east">US/Eastern (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">Cle API</Label>
              <Input id="apiKey" value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} className="font-mono" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-accent" />
              Notifications
            </CardTitle>
            <CardDescription>Gerez les preferences de notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Alertes critiques par email</p>
                <p className="text-xs text-muted-foreground">Recevoir un email pour chaque alerte critique</p>
              </div>
              <Switch checked={form.notifications.criticalEmail} onCheckedChange={(checked) => setForm({ ...form, notifications: { ...form.notifications, criticalEmail: checked } })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Rapport quotidien</p>
                <p className="text-xs text-muted-foreground">Resume quotidien de l'etat du reseau</p>
              </div>
              <Switch checked={form.notifications.dailyReport} onCheckedChange={(checked) => setForm({ ...form, notifications: { ...form.notifications, dailyReport: checked } })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Alertes maintenance predictive</p>
                <p className="text-xs text-muted-foreground">Notifications pour les taches suggerees par l'IA</p>
              </div>
              <Switch checked={form.notifications.predictiveMaintenance} onCheckedChange={(checked) => setForm({ ...form, notifications: { ...form.notifications, predictiveMaintenance: checked } })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Signalements citoyens</p>
                <p className="text-xs text-muted-foreground">Notification lors d'un nouveau signalement citoyen</p>
              </div>
              <Switch checked={form.notifications.citizenReports} onCheckedChange={(checked) => setForm({ ...form, notifications: { ...form.notifications, citizenReports: checked } })} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-4 w-4 text-accent" />
              Securite
            </CardTitle>
            <CardDescription>Parametres de securite et d&apos;authentification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Authentification 2FA</p>
                <p className="text-xs text-muted-foreground">Exiger l&apos;authentification a deux facteurs</p>
              </div>
              <Switch checked={form.security.require2FA} onCheckedChange={(checked) => setForm({ ...form, security: { ...form.security, require2FA: checked } })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Expiration de session</p>
                <p className="text-xs text-muted-foreground">Duree maximale d&apos;une session</p>
              </div>
              <Select value={form.security.sessionExpiry} onValueChange={(value) => setForm({ ...form, security: { ...form.security, sessionExpiry: value as AppSettings["security"]["sessionExpiry"] } })}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 heure</SelectItem>
                  <SelectItem value="4h">4 heures</SelectItem>
                  <SelectItem value="8h">8 heures</SelectItem>
                  <SelectItem value="24h">24 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Logs d&apos;audit</p>
                <p className="text-xs text-muted-foreground">Enregistrer toutes les actions utilisateur</p>
              </div>
              <Switch checked={form.security.auditLogs} onCheckedChange={(checked) => setForm({ ...form, security: { ...form.security, auditLogs: checked } })} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Database className="h-4 w-4 text-accent" />
              Base de Donnees
            </CardTitle>
            <CardDescription>Configuration de la base de donnees et des sauvegardes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sauvegarde automatique</p>
                <p className="text-xs text-muted-foreground">Sauvegarde quotidienne de la base</p>
              </div>
              <Switch checked={form.database.autoBackup} onCheckedChange={(checked) => setForm({ ...form, database: { ...form.database, autoBackup: checked } })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Retention des donnees</p>
                <p className="text-xs text-muted-foreground">Duree de conservation des historiques</p>
              </div>
              <Select value={form.database.retentionPeriod} onValueChange={(value) => setForm({ ...form, database: { ...form.database, retentionPeriod: value as AppSettings["database"]["retentionPeriod"] } })}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 mois</SelectItem>
                  <SelectItem value="6m">6 mois</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                  <SelectItem value="5y">5 ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => setForm(data)}>Annuler</Button>
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
