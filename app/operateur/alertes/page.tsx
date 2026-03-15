"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, TrendingUp, Clock, Eye, X, MessageSquareWarning,
  AlertTriangle, CheckCircle, Loader2, MapPin, Zap,
  RefreshCw, ArrowRight, Activity, Shield, Radio
} from "lucide-react"
import { useMemo, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useApiQuery } from "@/hooks/use-api-query"
import type { OperatorAlert, OperatorIncident, IncidentSummary } from "@/lib/types"

interface AlertsResponse {
  summary: { critique: number; alerte: number; moyen: number; faible: number }
  items: OperatorAlert[]
}
interface IncidentsResponse {
  items: OperatorIncident[]
  summary: IncidentSummary
}

const DEFAULT_ALERTS: AlertsResponse = { summary: { critique:0, alerte:0, moyen:0, faible:0 }, items:[] }
const DEFAULT_INCIDENTS: IncidentsResponse = { items:[], summary:{ nouveau:0, enCours:0, resolu:0, total:0 } }

const ALERT_DETAILS: Record<string,{ icon:string; sensor:string; zone:string; description:string; actions:string[]; impact:string; procedure:string }> = {
  "Fuite":         { icon:"💧", sensor:"Acoustique", zone:"Grand Dakar",  description:"Signature acoustique anormale détectée sur la canalisation principale. Vibrations caractéristiques d'une rupture partielle sur un tronçon en fonte de 35 ans.", actions:["Isoler le tronçon concerné","Envoyer équipe terrain","Ouvrir bon d'intervention","Prévenir les usagers"], impact:"Perte estimée 85 m³/h — coût ~72 000 FCFA/jour", procedure:"Protocole Fuite P-02 : isolation vanne amont + diagnostic terrain sous 2h" },
  "Panne pompe":   { icon:"⚙️", sensor:"Santé pompe", zone:"Station Fann", description:"Température de la pompe P1 dépasse 62°C (seuil critique 58°C). Vibrations anormales sur le palier. Risque d'arrêt total.", actions:["Réduire charge pompe à 60%","Activer pompe de secours P1-B","Planifier inspection paliers","Commander pièces de rechange"], impact:"Débit réduit de 1 200 m³/h — 45 000 habitants affectés", procedure:"Protocole Pompe PP-07 : bascule secours puis diagnostic vibratoire" },
  "Contamination": { icon:"🧪", sensor:"Qualité", zone:"Réservoir Pikine", description:"pH à 6.4 (norme 6.5–8.5). Turbidité 3.2 NTU (limite 1 NTU). Possible intrusion de substances étrangères dans le réservoir.", actions:["Interrompre distribution secteur","Prélever échantillons","Alerter autorités sanitaires","Activer réservoir de substitution"], impact:"Distribution suspendue zone C — 28 000 habitants. Risque santé publique.", procedure:"Protocole Contamination PC-01 : confinement immédiat + cellule crise" },
  "Fraude":        { icon:"🚨", sensor:"Débit", zone:"Guédiawaye", description:"Anomalie de débit sur compteur #891. Consommation 340% au-dessus de la normale depuis 6h. Signature caractéristique d'un branchement illicite.", actions:["Signaler aux équipes commerciales","Planifier contrôle sur site","Photographier installation","Saisir rapport fraude RF-2026"], impact:"Perte estimée 120 m³/h — manque à gagner ~95 000 FCFA/jour", procedure:"Protocole Fraude PF-03 : constat terrain + rapport PV sous 24h" },
  "Pression":      { icon:"📊", sensor:"Pression", zone:"Station HLM", description:"Chute de pression progressive depuis 3h. Vanne V-45 partiellement fermée (ouverture 35%). Pression descend sous 2.0 bar.", actions:["Vérifier position vanne V-45","Contrôler alimentation vanne","Augmenter pression en amont","Informer usagers si < 1.5 bar"], impact:"Faible débit au robinet pour 18 000 habitants du secteur HLM-Est", procedure:"Protocole Pression PP-04 : diagnostic vannes + compensation amont" },
  "Debit anormal": { icon:"📈", sensor:"Débit", zone:"Parcelles Assainies", description:"Débit 15% supérieur à la normale sur canalisation C12. Corrélation probable avec une fuite aval non encore détectée acoustiquement.", actions:["Activer surveillance renforcée","Lancer inspection acoustique","Croiser données capteurs voisins","Préparer équipe intervention"], impact:"Surconsommation estimée 40 m³/h", procedure:"Protocole Surveillance PS-01 : monitoring renforcé 24h + rapport" },
  "Temperature":   { icon:"🌡️", sensor:"Température", zone:"Réservoir Parcelles", description:"Température eau à 29.4°C (seuil 28°C). Accélère la prolifération bactérienne en période de chaleur.", actions:["Augmenter dosage chlore +0.1 mg/L","Effectuer prélèvement analyse","Vérifier isolation réservoir","Réduire temps de séjour eau"], impact:"Risque qualité microbiologique si T° dépasse 31°C sans action", procedure:"Protocole Qualité PQ-05 : ajustement traitement + surveillance horaire" },
}
const getDetail=(alert: OperatorAlert)=>ALERT_DETAILS[alert.type]??ALERT_DETAILS["Debit anormal"]

const STATUS_BADGE: Record<string,string> = {
  "Nouveau":"bg-blue-500/15 text-blue-400 border-blue-500/25",
  "En cours":"bg-amber-500/15 text-amber-400 border-amber-500/25",
  "Analyse":"bg-amber-500/15 text-amber-400 border-amber-500/25",
  "Résolu":"bg-green-500/15 text-green-400 border-green-500/25",
  "Fermé":"bg-slate-500/15 text-slate-400 border-slate-500/25",
  "Planifie":"bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Surveillance":"bg-teal-500/15 text-teal-400 border-teal-500/25",
}

const TYPE_LABELS: Record<string,string> = {
  fuite:"Fuite d'eau", qualite:"Qualité", pression:"Pression",
  coupure:"Coupure", odeur:"Odeur", autre:"Autre",
}

export default function AlertesPage() {
  const [activeTab, setActiveTab] = useState<"alertes"|"signalements">("alertes")

  // ── Alertes ──
  const [search, setSearch]               = useState("")
  const [severity, setSeverity]           = useState("all")
  const [classification, setClassification] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState<OperatorAlert|null>(null)

  const alertQuery = useMemo(()=>{
    const p=new URLSearchParams()
    if(search) p.set("search",search)
    if(severity!=="all") p.set("severity",severity)
    if(classification!=="all") p.set("classification",classification)
    const s=p.toString()
    return `/api/operateur/alertes${s?`?${s}`:""}`
  },[search,severity,classification])

  const { data: alertData, loading: alertLoading } = useApiQuery<AlertsResponse>(alertQuery, DEFAULT_ALERTS)

  // ── Signalements ──
  const [sigSearch, setSigSearch] = useState("")
  const [sigStatus, setSigStatus] = useState("all")
  const [updatingId, setUpdatingId] = useState<number|null>(null)
  const [sigRefresh, setSigRefresh] = useState(0)

  // On inclut sigRefresh dans l'URL pour forcer le re-fetch après update
  const sigQuery = useMemo(()=>{
    const p=new URLSearchParams()
    if(sigSearch) p.set("search",sigSearch)
    if(sigStatus!=="all") p.set("status",sigStatus)
    if(sigRefresh>0) p.set("_r",String(sigRefresh))
    const s=p.toString()
    return `/api/operateur/signalements${s?`?${s}`:""}`
  },[sigSearch,sigStatus,sigRefresh])

  const { data: sigData, loading: sigLoading } = useApiQuery<IncidentsResponse>(sigQuery, DEFAULT_INCIDENTS)

  const handleStatusUpdate = useCallback(async (id: number, newStatus: string)=>{
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/operateur/signalements/${id}`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        credentials:"include",
        body:JSON.stringify({status:newStatus}),
      })
      if(!res.ok) {
        const err = await res.json().catch(()=>({}))
        console.error("Update failed:", err)
      }
      // Force re-fetch en incrémentant le refresh counter
      setSigRefresh(r=>r+1)
    } finally {
      setUpdatingId(null)
    }
  },[])

  const detail = selectedAlert ? getDetail(selectedAlert) : null

  return (
    <DashboardLayout role="operateur" title="Alertes & Signalements">
      <div className="flex flex-col gap-4 min-h-0">

        {/* Onglets */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1 w-fit">
          <button onClick={()=>setActiveTab("alertes")}
            className={cn("flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition-all",
              activeTab==="alertes"?"bg-blue-500/15 text-blue-400 border border-blue-500/30":"text-foreground/60 hover:text-foreground hover:bg-secondary/50")}>
            <AlertTriangle className="h-4 w-4"/>
            <span className="hidden sm:inline">Alertes système</span>
            <span className="sm:hidden">Alertes</span>
            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full",
              activeTab==="alertes"?"bg-blue-500/20 text-blue-400":"bg-secondary text-muted-foreground")}>
              {alertData.summary.critique+alertData.summary.alerte}
            </span>
          </button>
          <button onClick={()=>setActiveTab("signalements")}
            className={cn("flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition-all",
              activeTab==="signalements"?"bg-amber-500/15 text-amber-400 border border-amber-500/30":"text-foreground/60 hover:text-foreground hover:bg-secondary/50")}>
            <MessageSquareWarning className="h-4 w-4"/>
            <span className="hidden sm:inline">Signalements citoyens</span>
            <span className="sm:hidden">Signalements</span>
            {sigData.summary.nouveau>0&&(
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">{sigData.summary.nouveau}</span>
            )}
          </button>
        </div>

        {/* ══ TAB ALERTES ══ */}
        {activeTab==="alertes"&&(
          <div className="flex flex-col lg:flex-row gap-4 min-h-0">
            <div className="flex-1 flex flex-col gap-4 min-w-0">

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  {key:"critique",label:"Critiques",border:"border-l-red-500",   dot:"bg-red-400"   },
                  {key:"alerte",  label:"Alertes",  border:"border-l-amber-500", dot:"bg-amber-400" },
                  {key:"moyen",   label:"Moyennes", border:"border-l-purple-500",dot:"bg-purple-400"},
                  {key:"faible",  label:"Faibles",  border:"border-l-slate-500", dot:"bg-slate-400" },
                ] as const).map(c=>(
                  <button key={c.key} onClick={()=>setSeverity(p=>p===c.key?"all":c.key)}
                    className={cn("text-left rounded-lg border-l-4 border border-border/60 bg-card p-3 sm:p-4 shadow-sm transition-all hover:shadow-md",c.border,severity===c.key?"ring-1 ring-inset":"")}>
                    <div className="flex items-start justify-between gap-1">
                      <div><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-xl sm:text-2xl font-bold tabular-nums">{alertData.summary[c.key]}</p></div>
                      <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0",c.dot)}/>
                    </div>
                  </button>
                ))}
              </div>

              {/* Filtres */}
              <Card className="border border-border/60">
                <CardContent className="flex flex-wrap items-center gap-2 p-3">
                  <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input placeholder="Rechercher…" className="pl-8 h-9" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Sévérité"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="critique">Critique</SelectItem>
                      <SelectItem value="alerte">Alerte</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="faible">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Type"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="Fuite">Fuite</SelectItem>
                      <SelectItem value="Panne pompe">Panne Pompe</SelectItem>
                      <SelectItem value="Fraude">Fraude</SelectItem>
                      <SelectItem value="Contamination">Contamination</SelectItem>
                    </SelectContent>
                  </Select>
                  {(severity!=="all"||classification!=="all"||search)&&(
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 text-muted-foreground"
                      onClick={()=>{setSeverity("all");setClassification("all");setSearch("")}}>
                      <X className="h-3.5 w-3.5"/> Effacer
                    </Button>
                  )}
                  {alertLoading&&<RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto"/>}
                </CardContent>
              </Card>

              {/* Liste alertes */}
              <Card className="border border-border/60 shadow-sm flex-1">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">
                    Alertes actives{alertData.items.length>0&&<span className="ml-2 text-xs font-normal text-muted-foreground">({alertData.items.length})</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {alertData.items.length===0?(
                    <div className="py-12 text-center text-sm text-muted-foreground">Aucune alerte pour ce filtre.</div>
                  ):alertData.items.map(alert=>{
                    const d=getDetail(alert), isSel=selectedAlert?.id===alert.id
                    return(
                      <div key={alert.id} onClick={()=>setSelectedAlert(isSel?null:alert)}
                        className={cn("flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 hover:bg-muted/30 last:border-0",isSel?"bg-primary/5 border-l-2 border-l-primary":"")}>
                        <span className="text-lg shrink-0">{d.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{alert.type}</span>
                            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{alert.id}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{alert.location}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3"/>{alert.probability}</span>
                          <span className="text-xs text-muted-foreground">{alert.date}</span>
                        </div>
                        <StatusBadge status={alert.severity}/>
                        <Badge variant="outline" className={cn("text-[10px] hidden sm:inline-flex",STATUS_BADGE[alert.status]??"")}>{alert.status}</Badge>
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0"/>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Panneau détail alerte */}
            {selectedAlert&&detail&&(
              <div className="w-full lg:w-80 shrink-0">
                <Card className="border border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl">{detail.icon}</span>
                          <div><p className="text-sm font-bold text-foreground">{selectedAlert.type}</p><p className="text-xs font-mono text-muted-foreground">{selectedAlert.id}</p></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={selectedAlert.severity}/>
                          <Badge variant="outline" className={cn("text-[10px]",STATUS_BADGE[selectedAlert.status]??"")}>{selectedAlert.status}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={()=>setSelectedAlert(null)}><X className="h-4 w-4"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[{l:"Capteur",v:detail.sensor,i:<Radio className="h-3 w-3"/>},{l:"Zone",v:detail.zone,i:<MapPin className="h-3 w-3"/>},{l:"Probabilité IA",v:selectedAlert.probability,i:<TrendingUp className="h-3 w-3"/>},{l:"Détectée",v:selectedAlert.date,i:<Clock className="h-3 w-3"/>}].map(m=>(
                        <div key={m.l} className="rounded-lg bg-muted/30 p-2.5">
                          <p className="text-muted-foreground mb-0.5">{m.l}</p>
                          <p className="font-semibold text-foreground flex items-center gap-1">{m.i}{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Diagnostic</p>
                      <p className="text-xs leading-relaxed text-foreground/80 bg-muted/20 rounded-lg p-3 border border-border/40">{detail.description}</p>
                    </div>
                    <div className="rounded-lg border p-3" style={{borderColor:"rgba(248,113,113,0.25)",background:"rgba(248,113,113,0.05)"}}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/80 mb-1.5 flex items-center gap-1"><Activity className="h-3 w-3"/> Impact estimé</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">{detail.impact}</p>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1.5 flex items-center gap-1"><Shield className="h-3 w-3"/> Procédure recommandée</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">{detail.procedure}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
                      <ol className="space-y-1.5">
                        {detail.actions.map((a,i)=>(
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px] shrink-0 mt-0.5">{i+1}</span>
                            <span className="text-foreground/75">{a}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <Button size="sm" className="w-full h-8 text-xs bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 gap-1.5">
                        <Zap className="h-3.5 w-3.5"/> Créer bon d'intervention
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1"><CheckCircle className="h-3.5 w-3.5"/> Acquitter</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 text-muted-foreground"><ArrowRight className="h-3.5 w-3.5"/> Escalader</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB SIGNALEMENTS ══ */}
        {activeTab==="signalements"&&(
          <div className="flex flex-col gap-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {label:"Total",   count:sigData.summary.total,   border:"border-l-slate-500", text:"text-foreground"},
                {label:"Nouveaux",count:sigData.summary.nouveau,  border:"border-l-blue-500",  text:"text-blue-400"},
                {label:"En cours",count:sigData.summary.enCours,  border:"border-l-amber-500", text:"text-amber-400"},
                {label:"Résolus", count:sigData.summary.resolu,   border:"border-l-green-500", text:"text-green-400"},
              ].map(c=>(
                <div key={c.label} className={cn("rounded-lg border-l-4 border border-border/60 bg-card p-3 sm:p-4 shadow-sm",c.border)}>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={cn("text-xl sm:text-2xl font-bold tabular-nums mt-0.5",c.text)}>{c.count}</p>
                </div>
              ))}
            </div>

            {/* Filtres */}
            <Card className="border border-border/60">
              <CardContent className="flex flex-wrap items-center gap-2 p-3">
                <div className="relative flex-1 min-w-40">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input placeholder="Rechercher…" className="pl-8 h-9" value={sigSearch} onChange={e=>setSigSearch(e.target.value)}/>
                </div>
                <Select value={sigStatus} onValueChange={setSigStatus}>
                  <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Statut"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Résolu">Résolu</SelectItem>
                    <SelectItem value="Fermé">Fermé</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={()=>setSigRefresh(r=>r+1)}>
                  <RefreshCw className={cn("h-3.5 w-3.5",sigLoading&&"animate-spin")}/> Actualiser
                </Button>
              </CardContent>
            </Card>

            {/* Liste signalements */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4 text-amber-400"/>
                  Signalements citoyens
                  <span className="text-xs font-normal text-muted-foreground">({sigData.items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sigData.items.length===0?(
                  <div className="py-12 text-center">
                    <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3"/>
                    <p className="text-sm font-semibold text-foreground">Tout est traité !</p>
                    <p className="text-xs text-muted-foreground mt-1">Aucun signalement ne correspond à ce filtre.</p>
                  </div>
                ):(
                  <div className="divide-y divide-border/40">
                    {sigData.items.map(inc=>(
                      <div key={inc.id} className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-foreground/40">#{inc.id}</span>
                              <span className="text-sm font-semibold text-foreground">{TYPE_LABELS[inc.type]??inc.type}</span>
                              <Badge variant="outline" className={cn("text-[10px]",STATUS_BADGE[inc.status]??"bg-muted")}>{inc.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0"/>{inc.location}</p>
                            <p className="text-xs text-foreground/60 line-clamp-2">{inc.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-foreground/40">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{inc.createdAt}</span>
                              {inc.reporterName&&<span>{inc.reporterName}</span>}
                            </div>
                          </div>
                          {/* Boutons workflow */}
                          <div className="flex flex-wrap sm:flex-col gap-2 sm:items-end sm:min-w-36 shrink-0">
                            {updatingId===inc.id?(
                              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin"/> Mise à jour…
                              </div>
                            ):(
                              <>
                                {inc.status==="Nouveau"&&(
                                  <Button size="sm" className="h-7 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                                    onClick={()=>handleStatusUpdate(inc.id,"En cours")}>
                                    Prendre en charge
                                  </Button>
                                )}
                                {inc.status==="En cours"&&(
                                  <Button size="sm" className="h-7 text-xs bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25"
                                    onClick={()=>handleStatusUpdate(inc.id,"Résolu")}>
                                    Marquer résolu ✓
                                  </Button>
                                )}
                                {(inc.status==="Résolu"||inc.status==="En cours")&&(
                                  <Button variant="outline" size="sm" className="h-7 text-xs"
                                    onClick={()=>handleStatusUpdate(inc.id,"Fermé")}>
                                    Fermer
                                  </Button>
                                )}
                                {inc.status==="Fermé"&&(
                                  <Button variant="outline" size="sm" className="h-7 text-xs"
                                    onClick={()=>handleStatusUpdate(inc.id,"Nouveau")}>
                                    Réouvrir
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
