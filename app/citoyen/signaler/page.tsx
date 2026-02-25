"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Send, Camera } from "lucide-react"

export default function SignalerPage() {
  return (
    <DashboardLayout role="citoyen" title="Signaler un Probleme">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Formulaire de Signalement</CardTitle>
            <CardDescription>
              {"Signalez un probleme lie au reseau d'eau. Votre signalement sera traite par nos equipes techniques."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="type">Type de probleme</Label>
              <Select>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuite">Fuite d&apos;eau</SelectItem>
                  <SelectItem value="qualite">Probleme de qualite</SelectItem>
                  <SelectItem value="pression">Pression anormale</SelectItem>
                  <SelectItem value="coupure">Coupure d&apos;eau</SelectItem>
                  <SelectItem value="odeur">Odeur suspecte</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Adresse / Localisation</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="location" placeholder="Entrez l'adresse du probleme" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Decrivez le probleme en detail..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (optionnel)</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cliquez pour ajouter une photo
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input id="name" placeholder="Votre nom" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input id="email" type="email" placeholder="votre@email.com" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="h-4 w-4" />
                Envoyer le Signalement
              </Button>
              <Button variant="outline">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
