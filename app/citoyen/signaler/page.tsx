"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MapPin, Send, Camera, CheckCircle, X, Trophy, Star, Zap } from "lucide-react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

// Zones surveillées par AquaPulse — identiques aux zones réseau IA
const QUARTIERS = [
  "Plateau",
  "Médina",
  "Fann",
  "HLM",
  "Grand Dakar",
  "Parcelles Assainies",
  "Pikine",
  "Guédiawaye",
  "Rufisque",
]

type EahFacilityOption = {
  id: number
  name: string
  quartier: string
  status: "operationnel" | "degradé" | "hors_service"
  community_signal_count?: number
  community_confirmation?: "none" | "to_verify" | "probable" | "confirmed"
}

const REPORT_MODES = {
  network: "network",
  eah: "eah",
} as const

const NETWORK_TYPES = [
  { value: "fuite", label: "💧 Fuite d'eau" },
  { value: "qualite", label: "🧪 Problème de qualité" },
  { value: "pression", label: "⚡ Pression anormale" },
  { value: "coupure", label: "🚫 Coupure d'eau" },
  { value: "odeur", label: "👃 Odeur suspecte" },
  { value: "contamination", label: "⚠️ Contamination suspectée" },
  { value: "autre", label: "📋 Autre" },
] as const

const EAH_TYPES = [
  { value: "panne_eah", label: "🚰 Site hors service" },
  { value: "hygiene", label: "🧼 Problème d'hygiène" },
  { value: "accessibilite", label: "♿ Problème d'accès" },
  { value: "lavage_mains", label: "🖐 Station de lavage défaillante" },
  { value: "latrine", label: "🚻 Latrine / toilettes non fonctionnelles" },
  { value: "autre_eah", label: "📋 Autre problème EAH" },
] as const

const COMMUNITY_CONFIG = {
  none: { label: "Aucun signalement", box: "border-slate-500/25 bg-slate-500/10 text-slate-300" },
  to_verify: { label: "À vérifier", box: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  probable: { label: "Probable", box: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300" },
  confirmed: { label: "Déjà confirmé", box: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
} as const

function SignalerPageInner() {
  const searchParams = useSearchParams()
  const [reportMode, setReportMode] = useState<"network" | "eah">("network")
  const [type,          setType]          = useState("")
  const [quartier,      setQuartier]      = useState("")
  const [adresseDetail, setAdresseDetail] = useState("")
  const [description,   setDescription]  = useState("")
  const [reporterName,  setReporterName]  = useState("")
  const [reporterEmail, setReporterEmail] = useState("")
  const [selectedEahId, setSelectedEahId] = useState("")
  const [eahOptions, setEahOptions] = useState<EahFacilityOption[]>([])
  const [photo,         setPhoto]         = useState<File | null>(null)
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [incidentId,    setIncidentId]    = useState<number | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // La localisation envoyée à l'API = "Quartier — adresse"
  // La partie quartier permet à l'IA de matcher avec les alertes réseau
  const selectedFacility = useMemo(
    () => eahOptions.find((facility) => String(facility.id) === selectedEahId) ?? null,
    [eahOptions, selectedEahId],
  )
  const availableTypes = reportMode === REPORT_MODES.eah ? EAH_TYPES : NETWORK_TYPES
  const selectedFacilityCommunity = COMMUNITY_CONFIG[selectedFacility?.community_confirmation ?? "none"]

  const location = selectedFacility
    ? `${selectedFacility.quartier} — ${selectedFacility.name}${adresseDetail.trim() ? ` — ${adresseDetail.trim()}` : ""}`
    : quartier
      ? adresseDetail.trim()
        ? `${quartier} — ${adresseDetail.trim()}`
        : quartier
      : adresseDetail.trim()

  useEffect(() => {
    const initialQuartier = searchParams.get("quartier")
    if (initialQuartier && QUARTIERS.includes(initialQuartier)) {
      setQuartier((current) => current || initialQuartier)
    }
    if (searchParams.get("mode") === REPORT_MODES.eah || searchParams.get("eah")) {
      setReportMode(REPORT_MODES.eah)
    }
  }, [searchParams])

  useEffect(() => {
    if (!quartier) {
      setEahOptions([])
      setSelectedEahId("")
      return
    }

    const ctrl = new AbortController()
    fetch(`/api/citoyen/eah?quartier=${encodeURIComponent(quartier)}`, {
      credentials: "include",
      signal: ctrl.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (!ctrl.signal.aborted) {
          setEahOptions((json?.items ?? []) as EahFacilityOption[])
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setEahOptions([])
      })

    return () => ctrl.abort()
  }, [quartier])

  useEffect(() => {
    const initialEah = searchParams.get("eah")
    if (initialEah && eahOptions.some((facility) => String(facility.id) === initialEah)) {
      setSelectedEahId((current) => current || initialEah)
    }
  }, [searchParams, eahOptions])

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
    setType(""); setQuartier(""); setAdresseDetail(""); setReportMode(REPORT_MODES.network)
    setDescription(""); setReporterName(""); setReporterEmail("")
    setSelectedEahId(""); setEahOptions([])
    removePhoto(); setStatusMessage(null); setIncidentId(null); setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!type || !quartier || !description) {
      setError("Veuillez renseigner le type de problème, le quartier et la description.")
      return
    }

    if (reportMode === REPORT_MODES.eah && !selectedFacility) {
      setError("Veuillez choisir le site EAH concerné.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/citoyen/incidents", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({
          type,
          location,
          description,
          reporterName,
          reporterEmail,
          eahFacilityId: selectedFacility?.id ?? null,
        }),
      })
      const json = (await response.json()) as { error?: string; incidentId?: number }
      if (!response.ok) throw new Error(json.error ?? "Envoi impossible")
      setIncidentId(json.incidentId ?? null)
      setStatusMessage("ok")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  // ── Écran de confirmation ─────────────────────────────────────────────────
  if (statusMessage && incidentId !== null) {
    return (
      <DashboardLayout role="citoyen" title="Signaler un problème">
        <div className="mx-auto max-w-md mt-8 space-y-4">
          {/* Confirmation principale */}
          <div className="rounded-2xl border border-teal-500/35 bg-teal-950/30 px-6 py-10 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-teal-400 mx-auto" />
            <div>
              <p className="text-xl font-bold text-teal-300">Signalement enregistré !</p>
              <p className="text-sm text-foreground/65 mt-2">
                Numéro de ticket :{" "}
                <span className="font-mono font-bold text-teal-400">#SIG-{incidentId}</span>
              </p>
            </div>
            <p className="text-sm text-foreground/60 bg-teal-900/20 rounded-lg px-4 py-2">
              Zone : <span className="font-semibold text-teal-300">{quartier}</span>
              {adresseDetail && <> — {adresseDetail}</>}
            </p>
            {selectedFacility && (
              <p className="text-xs text-foreground/55 bg-card/50 rounded-lg px-4 py-2">
                Ce signalement a été ajouté au site EAH <span className="font-semibold text-teal-300">{selectedFacility.name}</span>.
              </p>
            )}
            <p className="text-xs text-foreground/50">
              Nos équipes traiteront votre signalement sous 2h en cas d&apos;urgence.
            </p>
          </div>

          {/* Bloc points gagnés */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-sm font-bold text-amber-300">Points & Récompenses</p>
            </div>
            <div className="space-y-2 text-xs text-foreground/70">
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
                <span className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-amber-400" />Points attribués</span>
                <span className="font-bold text-amber-300">+10 pts</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-teal-500/10 px-3 py-2">
                <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-teal-400" />Si confirmé par l&apos;IA</span>
                <span className="font-bold text-teal-300">+10 à +20 pts</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2">
                <span className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-blue-400" />Si résolu par les équipes</span>
                <span className="font-bold text-blue-300">+5 pts</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center">
              Plus votre signalement est fiable, plus vous gagnez de points et montez dans le classement.
            </p>
            <a href="/citoyen/points" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors mt-1">
              Voir mes points &amp; badges →
            </a>
          </div>

          <Button onClick={resetForm} variant="outline"
            className="w-full border-teal-500/40 text-teal-300 hover:bg-teal-500/10">
            Faire un autre signalement
          </Button>
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
            <div className="flex items-center gap-2 text-xs rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2 mt-1">
              <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300/90">Chaque signalement validé vous rapporte des <strong>points</strong> et des <strong>badges</strong>. Soyez précis !</span>
              <a href="/citoyen/points" className="ml-auto text-amber-400 hover:underline shrink-0">Mes points →</a>
            </div>
            <CardDescription>
              Signalez un problème lié au réseau d&apos;eau. Votre signalement sera transmis
              aux équipes techniques et analysé par notre système IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>

              <div className="space-y-2">
                <Label>Type de signalement</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => { setReportMode(REPORT_MODES.network); setSelectedEahId(""); setType("") }}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      reportMode === REPORT_MODES.network
                        ? "border-teal-500/40 bg-teal-500/10 text-teal-200"
                        : "border-border/50 bg-card/50 text-foreground/70 hover:bg-secondary/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">Réseau d&apos;eau</p>
                    <p className="mt-1 text-xs text-foreground/60">Fuite, pression, qualité, coupure</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReportMode(REPORT_MODES.eah); setType("") }}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      reportMode === REPORT_MODES.eah
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                        : "border-border/50 bg-card/50 text-foreground/70 hover:bg-secondary/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">Site EAH</p>
                    <p className="mt-1 text-xs text-foreground/60">Latrine, borne-fontaine, lavage des mains, hygiène</p>
                  </button>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type de problème <span className="text-red-400">*</span></Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quartier — liste officielle pour la corrélation IA */}
              <div className="space-y-2">
                <Label htmlFor="quartier">
                  Quartier <span className="text-red-400">*</span>
                </Label>
                <Select value={quartier} onValueChange={setQuartier}>
                  <SelectTrigger id="quartier">
                    <SelectValue placeholder="Sélectionnez votre quartier" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTIERS.map(q => (
                      <SelectItem key={q} value={q}>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {q}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {reportMode === REPORT_MODES.eah
                    ? "Choisissez le quartier du site EAH concerné pour retrouver la bonne installation."
                    : "Sélectionner votre quartier permet à l'IA de corréler votre signalement avec les alertes capteurs de cette zone."}
                </p>
              </div>

              {quartier && eahOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="eah-site">
                    Site EAH concerné <span className="text-foreground/50 text-xs font-normal">{reportMode === REPORT_MODES.eah ? "(obligatoire)" : "(optionnel)"}</span>
                  </Label>
                  <Select value={selectedEahId} onValueChange={setSelectedEahId}>
                    <SelectTrigger id="eah-site">
                      <SelectValue placeholder="Choisir un site EAH dans ce quartier" />
                    </SelectTrigger>
                    <SelectContent>
                      {eahOptions.map((facility) => (
                        <SelectItem key={facility.id} value={String(facility.id)}>
                          {facility.name} · {facility.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {reportMode === REPORT_MODES.eah
                      ? "Votre signalement comptera dans la confirmation communautaire de ce site EAH."
                      : "Si vous sélectionnez un site EAH, votre signalement comptera dans sa confirmation communautaire."}
                  </p>
                  {selectedFacility && (
                    <div className={`rounded-xl border px-4 py-3 ${selectedFacilityCommunity.box}`}>
                      <p className="text-sm font-semibold">{selectedFacility.name}</p>
                      <p className="mt-1 text-xs">
                        {selectedFacility.community_signal_count ?? 0} citoyen{(selectedFacility.community_signal_count ?? 0) > 1 ? "s ont" : " a"} déjà signalé ce site.
                      </p>
                      <p className="mt-1 text-[11px] font-medium">
                        Niveau actuel: {selectedFacilityCommunity.label}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Adresse précise optionnelle */}
              <div className="space-y-2">
                <Label htmlFor="adresse">
                  Adresse précise{" "}
                  <span className="text-foreground/50 text-xs font-normal">(optionnel)</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="adresse"
                    placeholder={
                      selectedFacility
                        ? "Précision complémentaire (optionnel)"
                        : reportMode === REPORT_MODES.eah
                          ? "Ex : bloc nord, porte cassée"
                          : "Ex : Rue de la Paix, n°12"
                    }
                    className="pl-9"
                    value={adresseDetail}
                    onChange={e => setAdresseDetail(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-400">*</span></Label>
                <Textarea
                  id="description"
                  placeholder={
                    reportMode === REPORT_MODES.eah
                      ? "Décrivez le problème du site EAH: hors service, manque d'eau, problème d'hygiène, accès impossible..."
                      : "Décrivez le problème en détail — depuis quand, ce que vous observez..."
                  }
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Photo */}
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
                    <img src={photoPreview} alt="Aperçu" className="w-full max-h-48 object-cover" />
                    <button type="button" onClick={removePhoto}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    <p className="px-3 py-2 text-xs text-foreground/60 bg-card/80 border-t border-border/40">
                      {photo?.name}
                    </p>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-secondary/10 p-6 transition-colors hover:bg-secondary/20 hover:border-border">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ajouter une photo</span>
                  </button>
                )}
              </div>

              {/* Nom + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom <span className="text-foreground/50 text-xs font-normal">(optionnel)</span></Label>
                  <Input id="name" placeholder="Votre nom"
                    value={reporterName} onChange={e => setReporterName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-foreground/50 text-xs font-normal">(optionnel)</span></Label>
                  <Input id="email" type="email" placeholder="votre@email.com"
                    value={reporterEmail} onChange={e => setReporterEmail(e.target.value)} />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}
                  className="gap-2 bg-teal-500/15 border border-teal-500/40 text-teal-300 hover:bg-teal-500/25 hover:border-teal-500/60">
                  <Send className="h-4 w-4" />
                  {loading ? "Envoi en cours…" : "Envoyer le signalement"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
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

export default function SignalerPage() {
  return (
    <Suspense>
      <SignalerPageInner />
    </Suspense>
  )
}
