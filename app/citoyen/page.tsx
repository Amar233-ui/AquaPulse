"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenDashboardData } from "@/lib/types"
import {
  Droplets, Bell, CheckCircle, XCircle,
  Clock, MapPin, Send, ChevronDown,
} from "lucide-react"

const QUARTIERS = [
  "Plateau", "Médina", "Fann", "HLM",
  "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye", "Rufisque",
]

const EMPTY_DATA: CitizenDashboardData = {
  qualityScore: 0,
  temperature: 0,
  networkState: "—",
  activeAlerts: 0,
  networkHealth: 0,
  activeSensorsRate: 0,
  pressureRate: 0,
  waterQualityIndicators: [],
  recentAlerts: [],
}

type Onglet = "eau" | "alertes" | "signaler"

export default function CitoyenDashboard() {
  const [quartier, setQuartier] = useState("Plateau")
  const [onglet, setOnglet] = useState<Onglet>("eau")
  const [alertesActives, setAlertesActives] = useState(true)
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const [ticketId, setTicketId] = useState("")
  const [form, setForm] = useState({ type: "", adresse: "", description: "" })

  const { data, loading } = useApiQuery<CitizenDashboardData>(
    `/api/citoyen/dashboard?quartier=${encodeURIComponent(quartier)}`,
    EMPTY_DATA
  )

  const isPotable = data.qualityScore >= 80
  const phIndicator = data.waterQualityIndicators.find(i => i.label === "pH")
  const turbiditeIndicator = data.waterQualityIndicators.find(i => i.label === "Turbidite")
  const chloreIndicator = data.waterQualityIndicators.find(i => i.label === "Chlore residuel")

  const handleSignaler = async () => {
    if (!form.type || !form.adresse) return
    try {
      const res = await fetch("/api/citoyen/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: form.type.toLowerCase().replace(/[^a-z]/g, "_"),
          location: `${form.adresse} — ${quartier}`,
          description: form.description || form.type,
        }),
      })
      const json = await res.json() as { incidentId?: number }
      setTicketId(json.incidentId ? `#SIG-${json.incidentId}` : "#SIG-???")
    } catch {
      setTicketId("#SIG-ERR")
    }
    setSignalementEnvoye(true)
    setTimeout(() => {
      setSignalementEnvoye(false)
      setForm({ type: "", adresse: "", description: "" })
    }, 4000)
  }

  const TABS = [
    { id: "eau",      icon: Droplets, label: "Mon Eau" },
    { id: "alertes",  icon: Bell,     label: "Alertes" },
    { id: "signaler", icon: Send,     label: "Signaler" },
  ]

  return (
    <DashboardLayout role="citoyen" title="Mon Eau">
      <div className="space-y-5 pb-10">

        {/* Sélecteur quartier */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-semibold text-foreground">Mon quartier :</span>
          </div>
          <div className="relative">
            <select
              value={quartier}
              onChange={e => setQuartier(e.target.value)}
              className="appearance-none rounded-xl border border-teal-500/30 bg-teal-500/10 pl-4 pr-10 py-2.5 text-sm font-semibold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
            >
              {QUARTIERS.map(q => (
                <option key={q} value={q} className="bg-card text-foreground">{q}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
          </div>
        </div>

        {/* Hero card */}
        {loading ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : (
          <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${
            isPotable
              ? "bg-gradient-to-br from-teal-950/90 to-teal-900/50 border border-teal-500/40"
              : "bg-gradient-to-br from-red-950/90 to-red-900/50 border border-red-500/40"
          }`}>
            <div className={`absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl opacity-25 ${
              isPotable ? "bg-teal-400" : "bg-red-400"
            }`} />
            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <p className="mb-2 text-xs font-bold text-foreground/60 uppercase tracking-widest">
                  Qualité de l&apos;eau — {quartier}
                </p>
                <div className="flex items-center gap-3 mb-3">
                  {isPotable
                    ? <CheckCircle className="h-8 w-8 text-teal-400 flex-shrink-0" />
                    : <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                  }
                  <h2 className={`text-2xl sm:text-3xl font-bold ${isPotable ? "text-teal-300" : "text-red-300"}`}>
                    {isPotable ? "Eau potable" : "Attention requise"}
                  </h2>
                </div>
                <p className="text-sm text-foreground/75 max-w-md leading-relaxed">
                  Score : <span className="font-bold text-foreground">{data.qualityScore}/100</span>
                  {" — "}Réseau : <span className="font-semibold">{data.networkState}</span>
                </p>
              </div>
              <div className={`flex-shrink-0 rounded-2xl p-4 sm:p-5 ${isPotable ? "bg-teal-500/15" : "bg-red-500/15"}`}>
                <Droplets className={`h-10 w-10 ${isPotable ? "text-teal-400" : "text-red-400"}`} />
              </div>
            </div>

            {/* Indicateurs clés */}
            <div className="relative mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "pH",        indicator: phIndicator },
                { label: "Turbidité", indicator: turbiditeIndicator },
                { label: "Chlore",    indicator: chloreIndicator },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-black/25 px-3 py-3 backdrop-blur-sm text-center">
                  <div className={`text-lg font-bold ${
                    item.indicator?.status === "normal" ? "text-teal-300"
                    : item.indicator?.status === "alerte" ? "text-orange-400"
                    : "text-red-400"
                  }`}>
                    {item.indicator?.value ?? "—"}
                  </div>
                  <div className="text-xs text-foreground/60 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* KPIs réseau */}
            <div className="relative mt-3 flex flex-wrap gap-3">
              {[
                { label: "Santé réseau",    value: `${data.networkHealth}%`,     warn: data.networkHealth < 80 },
                { label: "Capteurs actifs", value: `${data.activeSensorsRate}%`, warn: data.activeSensorsRate < 80 },
                { label: "Alertes actives", value: String(data.activeAlerts),    warn: data.activeAlerts > 0 },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-black/20 px-4 py-2.5 backdrop-blur-sm">
                  <div className={`text-xl font-bold ${item.warn ? "text-orange-400" : "text-foreground"}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-foreground/60">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bannière signalement rapide */}
        <button
          onClick={() => setOnglet("signaler")}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-orange-500/30 bg-orange-500/8 px-5 py-3.5 text-left transition-all hover:bg-orange-500/12 hover:border-orange-500/50 group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/20 shrink-0">
              <Send className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-300">Vous voyez un problème ?</p>
              <p className="text-xs text-foreground/65">Fuite, eau trouble, coupure non signalée… signalez-le en 30 secondes</p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-3 py-1.5 rounded-lg group-hover:bg-orange-500/25 transition-colors whitespace-nowrap">
            Signaler →
          </span>
        </button>

        {/* Navigation onglets */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id as Onglet)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-all ${
                onglet === tab.id
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-foreground/65 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MON EAU */}
        {onglet === "eau" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Indicateurs de qualité</h3>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data.waterQualityIndicators.map(param => (
                  <div
                    key={param.label}
                    className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                      param.status === "normal"  ? "border-teal-500/25 bg-teal-950/20"
                      : param.status === "alerte" ? "border-orange-500/30 bg-orange-950/20"
                      : "border-red-500/30 bg-red-950/20"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{param.label}</p>
                      <p className="text-xs text-foreground/55 mt-0.5">Cible : {param.target}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        param.status === "normal"  ? "text-teal-300"
                        : param.status === "alerte" ? "text-orange-400"
                        : "text-red-400"
                      }`}>
                        {param.value}
                      </p>
                      <p className="text-xs text-foreground/55 capitalize">{param.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {[
              { emoji: "🕐", label: "État réseau",          value: data.networkState },
              { emoji: "📊", label: "Score qualité",         value: `${data.qualityScore} / 100` },
              { emoji: "📞", label: "Urgence eau (gratuit)", value: "800 800 800" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm text-foreground/75">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ALERTES */}
        {onglet === "alertes" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Alertes récentes</h3>

            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-5 py-4">
              <div>
                <p className="font-semibold text-sm text-foreground">Notifications pour {quartier}</p>
                <p className="text-xs text-foreground/65 mt-0.5">Recevoir les alertes de votre quartier</p>
              </div>
              <button
                onClick={() => setAlertesActives(!alertesActives)}
                className={`relative h-6 w-11 rounded-full transition-colors ${alertesActives ? "bg-teal-500" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alertesActives ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : data.recentAlerts.length === 0 ? (
              <div className="rounded-xl border border-teal-500/25 bg-teal-950/20 px-6 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-3" />
                <p className="font-semibold text-teal-300">Aucune alerte active</p>
                <p className="text-sm text-foreground/65 mt-1">Le réseau fonctionne normalement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-4 ${
                      alert.type === "critique" ? "border-red-500/35 bg-red-950/25"
                      : alert.type === "alerte"  ? "border-orange-500/35 bg-orange-950/20"
                      : "border-border/40 bg-card/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          alert.type === "critique" ? "bg-red-400 animate-pulse"
                          : alert.type === "alerte"  ? "bg-orange-400"
                          : "bg-teal-400"
                        }`} />
                        <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-foreground/55 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SIGNALER */}
        {onglet === "signaler" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Signaler un problème</h3>
              <p className="text-sm text-foreground/65 mt-1">Votre signalement sera transmis directement aux équipes techniques.</p>
            </div>

            {signalementEnvoye ? (
              <div className="rounded-xl border border-teal-500/35 bg-teal-950/30 px-6 py-12 text-center">
                <CheckCircle className="h-14 w-14 text-teal-400 mx-auto mb-4" />
                <p className="text-xl font-bold text-teal-300">Signalement envoyé !</p>
                <p className="text-sm text-foreground/65 mt-2">
                  Numéro de ticket : <span className="font-mono font-bold text-teal-400">{ticketId}</span>
                </p>
                <p className="text-xs text-foreground/50 mt-3">Nos équipes vous contacteront sous 2h en cas d&apos;urgence.</p>
              </div>
            ) : (
              <div className="space-y-5 rounded-xl border border-border/40 bg-card/60 p-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2.5 block">
                    Type de problème <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Fuite d'eau", "Eau trouble", "Pas d'eau", "Mauvaise odeur", "Canalisation cassée", "Autre"].map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, type }))}
                        className={`rounded-xl border px-3 py-3 text-sm text-left font-medium transition-all ${
                          form.type === type
                            ? "border-teal-500/60 bg-teal-500/15 text-teal-300"
                            : "border-border/40 bg-secondary/20 text-foreground/70 hover:border-border hover:text-foreground"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2.5 block">
                    Adresse <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                    <input
                      type="text"
                      value={form.adresse}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder={`Rue, numéro — ${quartier}`}
                      className="w-full rounded-xl border border-border/40 bg-secondary/20 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2.5 block">
                    Description <span className="text-foreground/50 text-xs font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le problème en quelques mots..."
                    rows={3}
                    className="w-full rounded-xl border border-border/40 bg-secondary/20 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleSignaler}
                  disabled={!form.type || !form.adresse}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-semibold py-3.5 text-sm transition-all hover:bg-teal-500/25 hover:border-teal-500/60 disabled:opacity-40 disabled:cursor-not-allowed"
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
