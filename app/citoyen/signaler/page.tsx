"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Send, Camera } from "lucide-react"
import { FormEvent, useState } from "react"

export default function SignalerPage() {
  const [type, setType] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [reporterName, setReporterName] = useState("")
  const [reporterEmail, setReporterEmail] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatusMessage(null)

    if (!type || !location || !description) {
      setError("Renseignez le type, la localisation et la description.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/citoyen/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          location,
          description,
          reporterName,
          reporterEmail,
        }),
      })

      const json = (await response.json()) as { error?: string; incidentId?: number }
      if (!response.ok) {
        throw new Error(json.error ?? "Envoi impossible")
      }

      setType("")
      setLocation("")
      setDescription("")
      setReporterName("")
      setReporterEmail("")
      setStatusMessage(`Signalement #${json.incidentId ?? "N/A"} enregistre.`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

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
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="type">Type de probleme</Label>
              <Select value={type} onValueChange={setType}>
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
                <Input
                  id="location"
                  placeholder="Entrez l'adresse du probleme"
                  className="pl-9"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Decrivez le probleme en detail..."
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
                <Input id="name" placeholder="Votre nom" value={reporterName} onChange={(event) => setReporterName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={reporterEmail}
                  onChange={(event) => setReporterEmail(event.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {statusMessage && <p className="text-sm text-success">{statusMessage}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                <Send className="h-4 w-4" />
                {loading ? "Envoi..." : "Envoyer le Signalement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setType("")
                  setLocation("")
                  setDescription("")
                  setReporterName("")
                  setReporterEmail("")
                  setStatusMessage(null)
                  setError(null)
                }}
              >
                Annuler
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
