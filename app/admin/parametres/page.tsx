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

export default function ParametresPage() {
  return (
    <DashboardLayout role="admin" title="Parametres">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* General Settings */}
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
                <Input id="orgName" defaultValue="Ville de Paris - Service des Eaux" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau Horaire</Label>
                <Select defaultValue="europe-paris">
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
              <Input id="apiKey" defaultValue="aqp_sk_*****************************" readOnly className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-accent" />
              Notifications
            </CardTitle>
            <CardDescription>Gerez les preferences de notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Alertes critiques par email", description: "Recevoir un email pour chaque alerte critique", defaultChecked: true },
              { label: "Rapport quotidien", description: "Resume quotidien de l'etat du reseau", defaultChecked: true },
              { label: "Alertes maintenance predictive", description: "Notifications pour les taches de maintenance suggerees par l'IA", defaultChecked: true },
              { label: "Signalements citoyens", description: "Notification lors d'un nouveau signalement citoyen", defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Settings */}
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Expiration de session</p>
                <p className="text-xs text-muted-foreground">Duree maximale d&apos;une session</p>
              </div>
              <Select defaultValue="8h">
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
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Retention des donnees</p>
                <p className="text-xs text-muted-foreground">Duree de conservation des historiques</p>
              </div>
              <Select defaultValue="1y">
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

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline">Annuler</Button>
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
