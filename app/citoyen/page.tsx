"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Droplets, AlertTriangle, Wrench, Bell, CheckCircle, XCircle, Clock, MapPin, ChevronRight, Send, X } from "lucide-react"

// ── Données mock ──────────────────────────────────────────────────────────────
const QUARTIERS = ["Plateau", "Médina", "Fann", "HLM", "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye"]

const STATUT_EAU: Record<string, { potable: boolean; message: string; detail: string }> = {
  "Plateau":              { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
  "Médina":               { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
  "Fann":                 { potable: false, message: "Attention requise",  detail: "Légère turbidité détectée — évitez la consommation directe" },
  "HLM":                  { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
  "Grand Dakar":          { potable: false, message: "Non recommandée",    detail: "Fuite en cours sur le réseau — risque de contamination" },
  "Parcelles Assainies":  { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
  "Pikine":               { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
  "Guédiawaye":           { potable: true,  message: "Eau potable",        detail: "Qualité conforme aux normes OMS" },
}

const COUPURES = [
  { id: 1, quartier: "Grand Dakar", rue: "Avenue Bourguiba", debut: "Aujourd'hui 14h", fin: "Demain 08h", cause: "Réparation fuite urgente", statut: "en_cours" },
  { id: 2, quartier: "Fann", rue: "Rue des Écoles", debut: "13 mars 06h", fin: "13 mars 18h", cause: "Travaux de maintenance", statut: "planifie" },
  { id: 3, quartier: "Pikine", rue: "Route de Pikine", debut: "15 mars 08h", fin: "15 mars 20h", cause: "Remplacement canalisation", statut: "planifie" },
]

const TRAVAUX = [
  { id: 1, quartier: "Médina", rue: "Rue Mohamed V", description: "Remplacement de canalisation vieillissante", debut: "12 mars", fin: "20 mars", impact: "Faible" },
  { id: 2, quartier: "HLM", rue: "Avenue Cheikh Anta Diop", description: "Extension du réseau de distribution", debut: "18 mars", fin: "30 mars", impact: "Modéré" },
  { id: 3, quartier: "Parcelles Assainies", rue: "Allée des Baobabs", description: "Inspection et nettoyage des conduites", debut: "14 mars", fin: "14 mars", impact: "Aucun" },
]

type Onglet = "eau" | "coupures" | "travaux" | "alertes" | "signaler"

export default function CitoyenDashboard() {
  const [quartier, setQuartier] = useState("Plateau")
  const [onglet, setOnglet] = useState<Onglet>("eau")
  const [alertesActives, setAlertesActives] = useState(true)
  const [showSignalement, setShowSignalement] = useState(false)
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const [form, setForm] = useState({ type: "", adresse: "", description: "" })

  const statutEau = STATUT_EAU[quartier]
  const coupuresQuartier = COUPURES.filter(c => c.quartier === quartier)
  const travauxQuartier = TRAVAUX.filter(t => t.quartier === quartier)
  const toutesCoupures = COUPURES
  const tousTravaux = TRAVAUX

  const handleSignaler = () => {
    if (!form.type || !form.adresse) return
    setSignalementEnvoye(true)
    setTimeout(() => {
      setShowSignalement(false)
      setSignalementEnvoye(false)
      setForm({ type: "", adresse: "", description: "" })
    }, 2500)
  }

  return (
    <DashboardLayout role="citoyen" title="Mon Eau">
      <div className="space-y-6 pb-10">

        {/* ── Sélecteur quartier ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-muted-foreground">Mon quartier :</span>
          </div>
          <select
            value={quartier}
            onChange={e => setQuartier(e.target.value)}
            className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        {/* ── Hero card — statut eau ── */}
        <div className={`relative overflow-hidden rounded-2xl p-8 ${
          statutEau.potable
            ? "bg-gradient-to-br from-teal-950/80 to-teal-900/40 border border-teal-500/30"
            : "bg-gradient-to-br from-red-950/80 to-red-900/40 border border-red-500/30"
        }`}>
          {/* Background glow */}
          <div className={`absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl opacity-20 ${
            statutEau.potable ? "bg-teal-400" : "bg-red-400"
          }`} />

          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Qualité de l'eau — {quartier}
              </p>
              <div className="flex items-center gap-3 mb-3">
                {statutEau.potable
                  ? <CheckCircle className="h-8 w-8 text-teal-400 flex-shrink-0" />
                  : <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                }
                <h2 className={`text-3xl font-bold ${statutEau.potable ? "text-teal-300" : "text-red-300"}`}>
                  {statutEau.message}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">{statutEau.detail}</p>
            </div>

            <div className={`flex-shrink-0 rounded-2xl p-5 ${
              statutEau.potable ? "bg-teal-500/15" : "bg-red-500/15"
            }`}>
              <Droplets className={`h-10 w-10 ${statutEau.potable ? "text-teal-400" : "text-red-400"}`} />
            </div>
          </div>

          {/* Résumé rapide */}
          <div className="relative mt-6 flex flex-wrap gap-4">
            {[
              { label: "Coupures en cours", value: coupuresQuartier.filter(c => c.statut === "en_cours").length, warn: true },
              { label: "Travaux prévus", value: travauxQuartier.length, warn: false },
              { label: "Alertes actives", value: statutEau.potable ? 0 : 1, warn: true },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-black/20 px-4 py-3 backdrop-blur-sm">
                <div className={`text-xl font-bold ${item.value > 0 && item.warn ? "text-orange-400" : "text-foreground"}`}>
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Navigation onglets ── */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
          {[
            { id: "eau",      icon: Droplets,       label: "Mon Eau" },
            { id: "coupures", icon: AlertTriangle,   label: "Coupures" },
            { id: "travaux",  icon: Wrench,          label: "Travaux" },
            { id: "alertes",  icon: Bell,            label: "Alertes" },
            { id: "signaler", icon: Send,            label: "Signaler" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id as Onglet)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                onglet === tab.id
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Contenu onglets ── */}

        {/* EAU */}
        {onglet === "eau" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Ce que vous devez savoir</h3>

            {/* Carte principale potabilité */}
            <div className={`rounded-xl border p-6 ${
              statutEau.potable
                ? "border-teal-500/20 bg-teal-950/30"
                : "border-red-500/20 bg-red-950/30"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-3 w-3 rounded-full ${statutEau.potable ? "bg-teal-400" : "bg-red-400"} animate-pulse`} />
                <span className="font-semibold">Eau du robinet à {quartier}</span>
              </div>
              <p className={`text-4xl font-bold mb-2 ${statutEau.potable ? "text-teal-300" : "text-red-300"}`}>
                {statutEau.potable ? "✓ Potable" : "⚠ Attention"}
              </p>
              <p className="text-sm text-muted-foreground">{statutEau.detail}</p>
              {!statutEau.potable && (
                <div className="mt-4 rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3">
                  <p className="text-sm text-orange-300 font-medium">💡 Recommandation</p>
                  <p className="text-sm text-muted-foreground mt-1">Faites bouillir l'eau avant consommation jusqu'à la résolution du problème.</p>
                </div>
              )}
            </div>

            {/* Infos simples */}
            {[
              { emoji: "🕐", label: "Dernière vérification", value: "Il y a 12 minutes" },
              { emoji: "🏥", label: "Conforme aux normes", value: statutEau.potable ? "OMS & ONA Sénégal" : "En cours de vérification" },
              { emoji: "📞", label: "Urgence eau", value: "800 800 800 (gratuit)" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* COUPURES */}
        {onglet === "coupures" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Coupures d'eau</h3>
              <span className="text-xs text-muted-foreground font-mono bg-secondary/40 px-2 py-1 rounded">
                {toutesCoupures.length} en cours / prévues
              </span>
            </div>

            {coupuresQuartier.length === 0 && (
              <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 px-6 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                <p className="font-semibold text-teal-300">Aucune coupure à {quartier}</p>
                <p className="text-sm text-muted-foreground mt-1">Votre quartier n'est pas affecté actuellement</p>
              </div>
            )}

            {toutesCoupures.map(c => (
              <div key={c.id} className={`rounded-xl border p-5 ${
                c.quartier === quartier
                  ? c.statut === "en_cours"
                    ? "border-red-500/30 bg-red-950/25"
                    : "border-orange-500/30 bg-orange-950/20"
                  : "border-border/40 bg-card/40 opacity-60"
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {c.statut === "en_cours"
                        ? <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse inline-block" />
                        : <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
                      }
                      <span className="font-semibold text-sm">{c.quartier}</span>
                      {c.quartier === quartier && (
                        <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Mon quartier</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.rue}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                    c.statut === "en_cours"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {c.statut === "en_cours" ? "En cours" : "Planifié"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Début</p>
                    <p className="font-medium">{c.debut}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fin prévue</p>
                    <p className="font-medium">{c.fin}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">🔧 {c.cause}</p>
              </div>
            ))}
          </div>
        )}

        {/* TRAVAUX */}
        {onglet === "travaux" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Travaux planifiés</h3>
              <span className="text-xs text-muted-foreground font-mono bg-secondary/40 px-2 py-1 rounded">
                {tousTravaux.length} chantiers
              </span>
            </div>

            {travauxQuartier.length === 0 && (
              <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 px-6 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                <p className="font-semibold text-teal-300">Aucun travaux à {quartier}</p>
                <p className="text-sm text-muted-foreground mt-1">Aucune intervention planifiée dans votre quartier</p>
              </div>
            )}

            {tousTravaux.map(t => (
              <div key={t.id} className={`rounded-xl border p-5 ${
                t.quartier === quartier
                  ? "border-blue-500/30 bg-blue-950/20"
                  : "border-border/40 bg-card/40 opacity-60"
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold text-sm">{t.quartier}</span>
                      {t.quartier === quartier && (
                        <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Mon quartier</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.rue}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                    t.impact === "Aucun" ? "bg-teal-500/20 text-teal-400"
                    : t.impact === "Faible" ? "bg-blue-500/20 text-blue-400"
                    : "bg-orange-500/20 text-orange-400"
                  }`}>
                    Impact {t.impact}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-3">{t.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Du {t.debut} au {t.fin}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALERTES */}
        {onglet === "alertes" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Mes alertes</h3>

            {/* Toggle notifications */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-5 py-4">
              <div>
                <p className="font-medium text-sm">Notifications pour {quartier}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recevoir les alertes de votre quartier</p>
              </div>
              <button
                onClick={() => setAlertesActives(!alertesActives)}
                className={`relative h-6 w-11 rounded-full transition-colors ${alertesActives ? "bg-teal-500" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alertesActives ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Types d'alertes */}
            <p className="text-sm text-muted-foreground">Vous serez notifié pour :</p>
            {[
              { emoji: "💧", label: "Problème de qualité de l'eau", active: true },
              { emoji: "🚰", label: "Coupure d'eau dans votre quartier", active: true },
              { emoji: "🔧", label: "Travaux planifiés près de chez vous", active: true },
              { emoji: "✅", label: "Retour à la normale", active: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 px-5 py-3.5">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm flex-1">{item.label}</span>
                <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
              </div>
            ))}

            <div className="rounded-xl border border-border/30 bg-secondary/20 px-5 py-4 text-center">
              <p className="text-sm text-muted-foreground">Les alertes sont envoyées par SMS et notification push</p>
            </div>
          </div>
        )}

        {/* SIGNALER */}
        {onglet === "signaler" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Signaler un problème</h3>
            <p className="text-sm text-muted-foreground">Votre signalement sera transmis directement aux équipes techniques.</p>

            {signalementEnvoye ? (
              <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 px-6 py-10 text-center">
                <CheckCircle className="h-12 w-12 text-teal-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-teal-300">Signalement envoyé !</p>
                <p className="text-sm text-muted-foreground mt-2">Nos équipes ont bien reçu votre signalement.<br/>Numéro de ticket : #SIG-{Math.floor(Math.random()*9000)+1000}</p>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border/40 bg-card/60 p-6">

                <div>
                  <label className="text-sm font-medium mb-2 block">Type de problème <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Fuite d'eau", "Eau trouble", "Pas d'eau", "Mauvaise odeur", "Canalisation cassée", "Autre"].map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, type }))}
                        className={`rounded-lg border px-3 py-2.5 text-sm text-left transition-all ${
                          form.type === type
                            ? "border-teal-500/60 bg-teal-500/15 text-teal-300 font-medium"
                            : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-border"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Adresse <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.adresse}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder={`Rue, numéro — ${quartier}`}
                      className="w-full rounded-lg border border-border/40 bg-secondary/20 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description <span className="text-muted-foreground text-xs">(optionnel)</span></label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le problème en quelques mots..."
                    rows={3}
                    className="w-full rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleSignaler}
                  disabled={!form.type || !form.adresse}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-semibold py-3.5 text-sm transition-all hover:bg-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  Envoyer le signalement
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
