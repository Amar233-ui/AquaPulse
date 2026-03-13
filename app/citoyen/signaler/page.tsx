"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Send, Camera, CheckCircle, X } from "lucide-react"
import { FormEvent, useRef, useState } from "react"

export default function SignalerPage() {
  const [type, setType]                     = useState("")
  const [location, setLocation]             = useState("")
  const [description, setDescription]       = useState("")
  const [reporterName, setReporterName]     = useState("")
  const [reporterEmail, setReporterEmail]   = useState("")
  const [photo, setPhoto]                   = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null)
  const [statusMessage, setStatusMessage]   = useState<string | null>(null)
  const [incidentId, setIncidentId]         = useState<number | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const fileInputRef                        = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const resetForm = () => {
    setType("")
    setLocation("")
    setDescription("")
    setReporterName("")
    setReporterEmail("")
    removePhoto()
    setStatusMessage(null)
    setIncidentId(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatusMessage(null)

    if (!type || !location || !description) {
      setError("Veuillez renseigner le type, la localisation et la description.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/citoyen/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, location, description, reporterName, reporterEmail }),
      })

      const json = (await response.json()) as { error?: string; incidentId?: number }
      if (!response.ok) throw new Error(json.error ?? "Envoi impossible")

      setIncidentId(json.incidentId ?? null)
      setStatusMessage("Signalement enregistré avec succès.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  // Écran de confirmation
  if (statusMessage && incidentId !== null) {
    return (
      <DashboardLayout role="citoyen" title="Signaler un problème">
        <div className="mx-auto max-w-md mt-8">
          <div className="rounded-2xl border border-teal-500/35 bg-teal-950/30 px-6 py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-teal-400 mx-auto" />
            <div>
              <p className="text-xl font-bold text-teal-300">Signalement enregistré !</p>
              <p className="text-sm text-foreground/65 mt-2">
                Numéro de ticket :{" "}
                <span className="font-mono font-bold text-teal-400">#SIG-{incidentId}</span>
              </p>
            </div>
            <p className="text-xs text-foreground/50">
              Nos équipes traiteront votre signalement sous 2h en cas d&apos;urgence.
            </p>
            <Button
              onClick={resetForm}
              variant="outline"
              className="mt-4 border-teal-500/40 text-teal-300 hover:bg-teal-500/10"
            >
              Faire un autre signalement
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="citoyen" title="Signaler un problème">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Formulaire de signalement</CardTitle>
            <CardDescription>
              Signalez un problème lié au réseau d&apos;eau. Votre signalement sera traité par nos équipes techniques.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>

              <div className="space-y-2">
                <Label htmlFor="type">Type de problème <span className="text-red-400">*</span></Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuite">Fuite d&apos;eau</SelectItem>
                    <SelectItem value="qualite">Problème de qualité</SelectItem>
                    <SelectItem value="pression">Pression anormale</SelectItem>
                    <SelectItem value="coupure">Coupure d&apos;eau</SelectItem>
                    <SelectItem value="odeur">Odeur suspecte</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Adresse / Localisation <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Entrez l'adresse du problème"
                    className="pl-9"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-400">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Photo — vraie gestion de fichier */}
              <div className="space-y-2">
                <Label>Photo <span className="text-foreground/50 text-xs font-normal">(optionnel)</span></Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <div className="relative w-full overflow-hidden rounded-xl border border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Aperçu photo" className="w-full max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="px-3 py-2 text-xs text-foreground/60 bg-card/80 border-t border-border/40">
                      {photo?.name}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-secondary/10 p-6 transition-colors hover:bg-secondary/20 hover:border-border"
                  >
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Ajouter une photo
                    </span>
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom <span className="text-foreground/50 text-xs font-normal">(optionnel)</span></Label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-foreground/50 text-xs font-normal">(optionnel)</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="gap-2 bg-teal-500/15 border border-teal-500/40 text-teal-300 hover:bg-teal-500/25 hover:border-teal-500/60"
                  disabled={loading}
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Envoi en cours…" : "Envoyer le signalement"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
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
