"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useRef, useCallback } from "react"
import {
  Play, RotateCcw, Download, Droplets, Thermometer,
  CloudRain, AlertTriangle, Zap, Gauge, Users, Factory, Clock, Flame, ChevronDown
} from "lucide-react"
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  ReferenceLine, BarChart, Bar, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"

interface SimParams {
  drought: number; temperature: number; rainfall: number
  pumpPower: number; leakRate: number; targetPressure: number
  population: number; industry: number; peakHour: "matin"|"soir"|"nuit"
  scenario: string
}
interface ZoneData { zone: string; pressure: number; flow: number; coverage: number; risk: number }
interface SimResult {
  points: Array<{hour:string;demand:number;supply:number;stress:number;loss:number}>
  zones: ZoneData[]
  metrics: {
    avgStress:number;peaks:number;reservoirPct:number;lostM3:number
    coverageRate:number;energyKwh:number;costFcfa:number
    waterQuality:number;vulnIndex:number;zonesAtRisk:number
  }
}

function computeSim(p: SimParams): SimResult {
  const ZONES = ["Plateau","Médina","Fann","HLM","Grand Dakar","Parcelles","Pikine","Guédiawaye"]
  const BASE_D = [95,60,155,195,175,145,100,70,50,65,135,180,165,135,95,75,55,70,110,165,140,120,90,60]
  const BASE_S = [120,115,120,145,140,135,120,110,100,110,120,145,140,130,120,110,100,105,115,140,135,125,115,110]
  const HOURS  = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}h`)
  const dF=Math.max(0.35,1-p.drought/120), tF=1+Math.max(0,p.temperature-30)/60
  const rF=Math.max(0.7,1-p.rainfall/600), pF=1+p.population/100
  const iF=1+p.industry/250, pkF=p.peakHour==="matin"?1.15:p.peakHour==="soir"?1.10:0.85
  const puF=p.pumpPower/100
  const points = HOURS.map((hour,i)=>{
    const peak=p.peakHour==="matin"?(i>=6&&i<=9):p.peakHour==="soir"?(i>=17&&i<=21):(i>=0&&i<=5)
    const demand=Math.round(BASE_D[i]*pF*iF*tF*(peak?pkF:1))
    const supply=Math.round(BASE_S[i]*dF*rF*puF)
    const loss=Math.round(supply*p.leakRate/100)
    const net=supply-loss
    const stress=Math.max(0,Math.round(((demand-net)/Math.max(net,1))*100))
    return {hour,demand,supply:net,stress,loss}
  })
  const zones:ZoneData[]=ZONES.map((_,i)=>({
    zone:ZONES[i],
    pressure:Math.max(0.5,Math.round((p.targetPressure*(0.7+i*0.03)*dF*puF-i*0.08)*10)/10),
    flow:Math.max(0,800+i*120-p.drought*4+p.pumpPower*3),
    coverage:Math.max(10,Math.min(100,90-p.drought*0.4-p.leakRate*0.5+p.pumpPower*0.2)),
    risk:Math.min(100,p.drought*0.4+p.leakRate*0.6+Math.max(0,70-p.pumpPower)*0.3),
  }))
  const avgStress=Math.round(points.reduce((s,x)=>s+x.stress,0)/24)
  const peaks=points.filter(x=>x.stress>35).length
  const reservoirPct=Math.max(8,Math.round(88-p.drought*0.65-p.leakRate*0.25))
  const lostM3=Math.round(points.reduce((s,x)=>s+x.loss,0))
  const coverageRate=Math.round(Math.min(100,points.reduce((s,x)=>s+x.supply,0)/points.reduce((s,x)=>s+x.demand,0)*100))
  const energyKwh=Math.round(points.reduce((s,x)=>s+x.supply*0.18,0))
  const costFcfa=Math.round(lostM3*850)
  const waterQuality=Math.max(20,Math.round(95-p.drought*0.3-p.leakRate*0.4-Math.max(0,p.temperature-35)*0.5))
  const vulnIndex=Math.min(100,Math.round(p.drought*0.35+p.leakRate*0.3+Math.max(0,70-p.pumpPower)*0.25+p.population*0.1))
  const zonesAtRisk=zones.filter(z=>z.coverage<70).length
  return {points,zones,metrics:{avgStress,peaks,reservoirPct,lostM3,coverageRate,energyKwh,costFcfa,waterQuality,vulnIndex,zonesAtRisk}}
}

function PSlider({label,icon:Icon,value,min,max,step,unit,accent,onChange}:{
  label:string;icon:any;value:number;min:number;max:number;step:number;unit:string;accent:string;onChange:(v:number)=>void
}) {
  const pct=((value-min)/(max-min))*100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5"/><span>{label}</span>
        </div>
        <span className="font-semibold tabular-nums" style={{color:accent}}>{value}{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted cursor-pointer"
        onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onChange(Math.round((min+(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)))*(max-min))/step)*step)}}>
        <div className="absolute h-full rounded-full" style={{width:`${pct}%`,background:accent,opacity:0.75}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"/>
        <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 bg-background shadow"
          style={{left:`calc(${pct}% - 7px)`,borderColor:accent}}/>
      </div>
    </div>
  )
}

const PRESETS:Record<string,Partial<SimParams>>={
  baseline:      {drought:15,temperature:30,rainfall:80, pumpPower:90,leakRate:8, targetPressure:3.5,population:5, industry:30,peakHour:"matin"},
  secheresse:    {drought:72,temperature:42,rainfall:5,  pumpPower:75,leakRate:12,targetPressure:3.0,population:10,industry:40,peakHour:"soir"},
  inondation:    {drought:0, temperature:28,rainfall:280,pumpPower:55,leakRate:28,targetPressure:2.5,population:5, industry:20,peakHour:"matin"},
  contamination: {drought:25,temperature:34,rainfall:40, pumpPower:80,leakRate:6, targetPressure:3.0,population:8, industry:25,peakHour:"soir"},
  panne:         {drought:10,temperature:31,rainfall:60, pumpPower:25,leakRate:18,targetPressure:1.5,population:5, industry:30,peakHour:"matin"},
  vaguechaleur:  {drought:50,temperature:48,rainfall:2,  pumpPower:82,leakRate:14,targetPressure:3.5,population:15,industry:60,peakHour:"soir"},
  croissance:    {drought:12,temperature:31,rainfall:70, pumpPower:88,leakRate:10,targetPressure:3.5,population:45,industry:80,peakHour:"matin"},
  rupture:       {drought:20,temperature:33,rainfall:50, pumpPower:40,leakRate:35,targetPressure:1.2,population:5, industry:20,peakHour:"soir"},
}
const DEFAULT:SimParams={...PRESETS.baseline as SimParams,scenario:"baseline"}
const SCENARIOS=[
  {id:"baseline",     label:"Référence",        icon:"○"},
  {id:"secheresse",   label:"Sécheresse",        icon:"☀"},
  {id:"inondation",   label:"Inondation",        icon:"〰"},
  {id:"contamination",label:"Contamination",     icon:"⚠"},
  {id:"panne",        label:"Panne pompes",      icon:"⚡"},
  {id:"vaguechaleur", label:"Vague de chaleur",  icon:"♨"},
  {id:"croissance",   label:"Croissance urbaine",icon:"↑"},
  {id:"rupture",      label:"Rupture conduite",  icon:"✕"},
]

const RED="#dc2626", AMBER="#ca8a04", GREEN="#16a34a", BLUE="#2563eb", PURPLE="#7c3aed", SLATE="#64748b"
const statusColor=(v:number,good:"high"|"low"="high")=>{
  const bad=good==="high"?v<30:v>60, mid=good==="high"?v<60:v>30
  return bad?RED:mid?AMBER:GREEN
}

// Accordéon section pour mobile
function Section({title, defaultOpen=false, children}:{title:string;defaultOpen?:boolean;children:React.ReactNode}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sc">
      <button
        onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open?"rotate-180":""}`}/>
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  )
}

export default function SimulateurPage() {
  const [params,setParams]=useState<SimParams>(DEFAULT)
  const [result,setResult]=useState<SimResult>(()=>computeSim(DEFAULT))
  const [running,setRunning]=useState(false)
  const [visible,setVisible]=useState(24)
  const [tab,setTab]=useState<"debit"|"zones"|"radar">("debit")
  const animRef=useRef<any>(null)

  const up=useCallback(<K extends keyof SimParams>(k:K,v:SimParams[K])=>{
    const np={...params,[k]:v};setParams(np);setResult(computeSim(np))
  },[params])

  const applyScenario=(id:string)=>{
    const np={...params,scenario:id,...(PRESETS[id]??{})};setParams(np);setResult(computeSim(np))
  }
  const handleRun=()=>{
    setRunning(true);setVisible(1);const r=computeSim(params);setResult(r)
    let i=1;animRef.current=setInterval(()=>{i+=2;setVisible(Math.min(i,24));if(i>=24){clearInterval(animRef.current);setRunning(false)}},80)
  }
  const handleReset=()=>{clearInterval(animRef.current);setRunning(false);setVisible(24);setParams(DEFAULT);setResult(computeSim(DEFAULT))}

  const {points,zones,metrics}=result
  const visData=points.slice(0,visible)
  const radarData=[
    {subject:"Couverture",  A:metrics.coverageRate},
    {subject:"Qualité",     A:metrics.waterQuality},
    {subject:"Réservoirs",  A:metrics.reservoirPct},
    {subject:"Pompes",      A:params.pumpPower},
    {subject:"Pression",    A:Math.round((params.targetPressure-1)/5*100)},
    {subject:"Anti-Fuites", A:100-params.leakRate*2},
  ]

  const kpisPrimary=[
    {label:"Vulnérabilité", value:`${metrics.vulnIndex}`,               unit:"/100",  color:statusColor(metrics.vulnIndex,"low"), icon:AlertTriangle},
    {label:"Couverture",    value:`${metrics.coverageRate}`,             unit:"%",     color:statusColor(metrics.coverageRate),    icon:Gauge},
    {label:"Énergie",       value:`${metrics.energyKwh}`,               unit:" kWh",  color:SLATE,                               icon:Zap},
    {label:"Vol. perdu",    value:`${metrics.lostM3}`,                  unit:" m³",   color:metrics.lostM3>500?RED:AMBER,        icon:Droplets},
    {label:"Coût pertes",   value:`${(metrics.costFcfa/1000).toFixed(0)}k`, unit:" FCFA", color:SLATE,                           icon:Factory},
  ]
  const kpisSecondary=[
    {label:"Stress hydrique moyen", value:`${metrics.avgStress}%`,       color:statusColor(metrics.avgStress,"low")},
    {label:"Pics de déficit (24h)", value:`${metrics.peaks} créneaux`,   color:metrics.peaks>4?RED:AMBER},
    {label:"Niveau réservoirs",     value:`${metrics.reservoirPct}%`,    color:statusColor(metrics.reservoirPct)},
    {label:"Qualité eau estimée",   value:`${metrics.waterQuality}/100`, color:statusColor(metrics.waterQuality)},
  ]

  return (
    <DashboardLayout role="operateur" title="Simulateur de Stress Hydrique" fullscreen>
      <style>{`
        .sc{background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:10px}
        .st{padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;border:1px solid transparent;background:transparent;color:hsl(var(--muted-foreground))}
        .st:hover{background:hsl(var(--muted))}
        .st.on{background:hsl(var(--muted));border-color:hsl(var(--border));color:hsl(var(--foreground))}
        .sl::-webkit-scrollbar{width:3px}
        .sl::-webkit-scrollbar-thumb{background:hsl(var(--border));border-radius:2px}
      `}</style>

      {/* ── LAYOUT RESPONSIVE ──
          Mobile  : colonne unique, sections accordéon
          Desktop : grille fixe 285px | reste  */}
      <div className="block lg:hidden space-y-3 pb-4">

        {/* KPIs en grid 2x3 sur mobile */}
        <div className="grid grid-cols-2 gap-2">
          {kpisPrimary.map(k=>(
            <div key={k.label} className="sc px-3 py-2.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <k.icon className="h-3 w-3"/><span>{k.label}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold tabular-nums" style={{color:k.color}}>{k.value}</span>
                <span className="text-[10px] text-muted-foreground">{k.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* KPIs secondaires */}
        <div className="grid grid-cols-2 gap-2">
          {kpisSecondary.map(k=>(
            <div key={k.label} className="sc px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground leading-tight">{k.label}</span>
              <span className="text-sm font-semibold" style={{color:k.color}}>{k.value}</span>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="sc">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 overflow-x-auto">
            {[{id:"debit",label:"Débit 24h"},{id:"zones",label:"Zones"},{id:"radar",label:"Santé"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)} className={`st whitespace-nowrap${tab===t.id?" on":""}`}>{t.label}</button>
            ))}
          </div>
          <div className="p-2" style={{height:220}}>
            {tab==="debit"&&(
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visData} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <defs>
                    {([[BLUE,"dG"],[RED,"sG"],[PURPLE,"lG"]] as [string,string][]).map(([c,id])=>(
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.12}/>
                        <stop offset="100%" stopColor={c} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize:8,fill:"hsl(var(--muted-foreground))"}} interval={3}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:8,fill:"hsl(var(--muted-foreground))"}}/> 
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:10}}/>
                  <Area type="monotone" dataKey="demand" stroke={BLUE}   fill="url(#dG)" strokeWidth={1.5} dot={false} name="Demande"/>
                  <Area type="monotone" dataKey="supply" stroke={GREEN}  fill="none"     strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Offre"/>
                  <Area type="monotone" dataKey="stress" stroke={RED}    fill="url(#sG)" strokeWidth={1.5} dot={false} name="Stress"/>
                  <Area type="monotone" dataKey="loss"   stroke={PURPLE} fill="url(#lG)" strokeWidth={1}   dot={false} name="Pertes"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
            {tab==="zones"&&(
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zones} margin={{top:4,right:4,left:-28,bottom:20}}>
                  <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{fontSize:7,fill:"hsl(var(--muted-foreground))"}} angle={-20} textAnchor="end"/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:8,fill:"hsl(var(--muted-foreground))"}}/> 
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:10}}/>
                  <Bar dataKey="coverage" name="Couverture %" fill={GREEN}  fillOpacity={0.65} radius={[3,3,0,0]}/>
                  <Bar dataKey="risk"     name="Risque %"     fill={RED}    fillOpacity={0.60} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
            {tab==="radar"&&(
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))"/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}}/> 
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:7,fill:"hsl(var(--muted-foreground))"}}/> 
                  <Radar name="Réseau" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} strokeWidth={1.5}/>
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Scénarios — accordéon */}
        <Section title="Scénario prédéfini" defaultOpen>
          <div className="grid grid-cols-2 gap-1.5">
            {SCENARIOS.map(sc=>(
              <button key={sc.id} onClick={()=>applyScenario(sc.id)}
                className="rounded-lg px-2 py-2 text-left text-[11px] font-medium transition-all flex items-center gap-1.5"
                style={{
                  background:params.scenario===sc.id?"hsl(var(--muted))":"transparent",
                  border:`1px solid ${params.scenario===sc.id?"hsl(var(--border))":"hsl(var(--border) / 0.4)"}`,
                  color:params.scenario===sc.id?"hsl(var(--foreground))":"hsl(var(--muted-foreground))",
                }}>
                <span className="opacity-50 text-[10px]">{sc.icon}</span>{sc.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Paramètres climatiques */}
        <Section title="Climatiques">
          <PSlider label="Sécheresse"   icon={Thermometer} value={params.drought}      min={0}  max={100} step={5}   unit="%" accent={RED}    onChange={v=>up("drought",v)}/>
          <PSlider label="Température"  icon={Flame}       value={params.temperature}   min={20} max={50}  step={1}   unit="°C" accent={AMBER} onChange={v=>up("temperature",v)}/>
          <PSlider label="Pluviométrie" icon={CloudRain}   value={params.rainfall}      min={0}  max={300} step={10}  unit=" mm" accent={BLUE}  onChange={v=>up("rainfall",v)}/>
        </Section>

        {/* Infrastructure */}
        <Section title="Infrastructure">
          <PSlider label="Puissance pompes"  icon={Zap}      value={params.pumpPower}      min={20} max={100} step={5}   unit="%" accent={GREEN}  onChange={v=>up("pumpPower",v)}/>
          <PSlider label="Pertes réseau"     icon={Droplets} value={params.leakRate}       min={0}  max={40}  step={1}   unit="%" accent={PURPLE} onChange={v=>up("leakRate",v)}/>
          <PSlider label="Pression cible"    icon={Gauge}    value={params.targetPressure} min={1}  max={6}   step={0.5} unit=" bar" accent={SLATE} onChange={v=>up("targetPressure",v)}/>
        </Section>

        {/* Socio-économiques */}
        <Section title="Socio-économiques">
          <PSlider label="Croissance population" icon={Users}   value={params.population} min={0} max={50}  step={1} unit="%" accent={AMBER} onChange={v=>up("population",v)}/>
          <PSlider label="Activité industrielle" icon={Factory} value={params.industry}   min={0} max={100} step={5} unit="%" accent={SLATE} onChange={v=>up("industry",v)}/>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5"/><span>Heure de pointe</span>
            </div>
            <div className="flex gap-1">
              {(["matin","soir","nuit"] as const).map(h=>(
                <button key={h} onClick={()=>up("peakHour",h)}
                  className="flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-all"
                  style={{
                    background:params.peakHour===h?"hsl(var(--muted))":"transparent",
                    border:`1px solid hsl(var(--border) / ${params.peakHour===h?1:0.4})`,
                    color:params.peakHour===h?"hsl(var(--foreground))":"hsl(var(--muted-foreground))",
                  }}>{h}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div className="sc p-3 space-y-2">
          <button onClick={handleRun} disabled={running}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{background:"hsl(var(--primary))",color:"hsl(var(--primary-foreground))"}}>
            <Play className="h-4 w-4"/>
            {running?"Simulation en cours…":"Lancer la Simulation"}
          </button>
          <div className="flex gap-2">
            <button onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-all">
              <RotateCcw className="h-3.5 w-3.5"/> Réinitialiser
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-all">
              <Download className="h-3.5 w-3.5"/> Exporter
            </button>
          </div>
        </div>

        {metrics.zonesAtRisk>0&&(
          <div className="sc px-3 py-2 flex items-center gap-3" style={{borderColor:`${RED}44`,background:`${RED}08`}}>
            <AlertTriangle className="h-4 w-4 shrink-0" style={{color:RED}}/>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold" style={{color:RED}}>{metrics.zonesAtRisk} zone{metrics.zonesAtRisk>1?"s":""}</span> en déficit :&nbsp;
              {zones.filter(z=>z.coverage<70).map(z=>z.zone).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT (>= lg) ── */}
      <div className="hidden lg:grid" style={{gridTemplateColumns:"285px 1fr",gap:"12px",height:"100%",maxHeight:"calc(100vh - 5.5rem)",overflow:"hidden"}}>

        {/* LEFT */}
        <div className="sl flex flex-col gap-2.5 overflow-y-auto pr-0.5">
          <div className="sc p-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Scénario prédéfini</p>
            <div className="grid grid-cols-2 gap-1">
              {SCENARIOS.map(sc=>(
                <button key={sc.id} onClick={()=>applyScenario(sc.id)}
                  className="rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background:params.scenario===sc.id?"hsl(var(--muted))":"transparent",
                    border:`1px solid ${params.scenario===sc.id?"hsl(var(--border))":"transparent"}`,
                    color:params.scenario===sc.id?"hsl(var(--foreground))":"hsl(var(--muted-foreground))",
                  }}>
                  <span className="opacity-50 text-[10px]">{sc.icon}</span>{sc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sc p-3 space-y-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Climatiques</p>
            <PSlider label="Sécheresse"   icon={Thermometer} value={params.drought}      min={0}  max={100} step={5}   unit="%" accent={RED}    onChange={v=>up("drought",v)}/>
            <PSlider label="Température"  icon={Flame}       value={params.temperature}   min={20} max={50}  step={1}   unit="°C" accent={AMBER} onChange={v=>up("temperature",v)}/>
            <PSlider label="Pluviométrie" icon={CloudRain}   value={params.rainfall}      min={0}  max={300} step={10}  unit=" mm" accent={BLUE}  onChange={v=>up("rainfall",v)}/>
          </div>

          <div className="sc p-3 space-y-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Infrastructure</p>
            <PSlider label="Puissance pompes"  icon={Zap}      value={params.pumpPower}      min={20} max={100} step={5}   unit="%" accent={GREEN}  onChange={v=>up("pumpPower",v)}/>
            <PSlider label="Pertes réseau"     icon={Droplets} value={params.leakRate}       min={0}  max={40}  step={1}   unit="%" accent={PURPLE} onChange={v=>up("leakRate",v)}/>
            <PSlider label="Pression cible"    icon={Gauge}    value={params.targetPressure} min={1}  max={6}   step={0.5} unit=" bar" accent={SLATE} onChange={v=>up("targetPressure",v)}/>
          </div>

          <div className="sc p-3 space-y-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Socio-économiques</p>
            <PSlider label="Croissance population" icon={Users}   value={params.population} min={0} max={50}  step={1} unit="%" accent={AMBER} onChange={v=>up("population",v)}/>
            <PSlider label="Activité industrielle" icon={Factory} value={params.industry}   min={0} max={100} step={5} unit="%" accent={SLATE} onChange={v=>up("industry",v)}/>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5"/><span>Heure de pointe</span>
              </div>
              <div className="flex gap-1">
                {(["matin","soir","nuit"] as const).map(h=>(
                  <button key={h} onClick={()=>up("peakHour",h)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-all"
                    style={{
                      background:params.peakHour===h?"hsl(var(--muted))":"transparent",
                      border:`1px solid hsl(var(--border) / ${params.peakHour===h?1:0.4})`,
                      color:params.peakHour===h?"hsl(var(--foreground))":"hsl(var(--muted-foreground))",
                    }}>{h}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="sc p-3 space-y-2">
            <button onClick={handleRun} disabled={running}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{background:"hsl(var(--primary))",color:"hsl(var(--primary-foreground))"}}>
              <Play className="h-4 w-4"/>
              {running?"Simulation en cours…":"Lancer la Simulation"}
            </button>
            <div className="flex gap-2">
              <button onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-all">
                <RotateCcw className="h-3.5 w-3.5"/> Réinitialiser
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-all">
                <Download className="h-3.5 w-3.5"/> Exporter
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-2.5 min-h-0 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 shrink-0">
            {kpisPrimary.map(k=>(
              <div key={k.label} className="sc px-3 py-2.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <k.icon className="h-3 w-3"/><span>{k.label}</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[19px] font-bold tabular-nums" style={{color:k.color}}>{k.value}</span>
                  <span className="text-[10px] text-muted-foreground">{k.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 shrink-0">
            {kpisSecondary.map(k=>(
              <div key={k.label} className="sc px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground leading-tight">{k.label}</span>
                <span className="text-sm font-semibold whitespace-nowrap" style={{color:k.color}}>{k.value}</span>
              </div>
            ))}
          </div>

          <div className="sc flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
              <div className="flex gap-1">
                {[{id:"debit",label:"Débit & Stress 24h"},{id:"zones",label:"Zones"},{id:"radar",label:"Santé globale"}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id as any)} className={`st${tab===t.id?" on":""}`}>{t.label}</button>
                ))}
              </div>
              {tab==="debit"&&(
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  {[[BLUE,"Demande"],[GREEN,"Offre"],[RED,"Stress"],[PURPLE,"Pertes"]].map(([c,l])=>(
                    <span key={l} className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-4 rounded" style={{background:c}}/>{l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 p-3">
              {tab==="debit"&&(
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visData} margin={{top:6,right:8,left:-24,bottom:0}}>
                    <defs>
                      {([[BLUE,"dG"],[RED,"sG"],[PURPLE,"lG"]] as [string,string][]).map(([c,id])=>(
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={0.12}/>
                          <stop offset="100%" stopColor={c} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}} interval={2}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}}/> 
                    <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:11}} labelStyle={{color:"hsl(var(--foreground))",fontWeight:600}}/>
                    {metrics.avgStress>20&&<ReferenceLine y={140} stroke={AMBER} strokeDasharray="4 4" strokeWidth={1}/>}
                    <Area type="monotone" dataKey="demand" stroke={BLUE}   fill="url(#dG)" strokeWidth={1.5} dot={false} name="Demande m³/h"/>
                    <Area type="monotone" dataKey="supply" stroke={GREEN}  fill="none"     strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Offre nette m³/h"/>
                    <Area type="monotone" dataKey="stress" stroke={RED}    fill="url(#sG)" strokeWidth={1.5} dot={false} name="Stress %"/>
                    <Area type="monotone" dataKey="loss"   stroke={PURPLE} fill="url(#lG)" strokeWidth={1}   dot={false} name="Pertes m³/h"/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {tab==="zones"&&(
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zones} margin={{top:6,right:8,left:-24,bottom:24}}>
                    <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}} angle={-20} textAnchor="end"/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:"hsl(var(--muted-foreground))"}}/> 
                    <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:11}}/>
                    <Legend wrapperStyle={{fontSize:10,color:"hsl(var(--muted-foreground))"}}/> 
                    <Bar dataKey="coverage" name="Couverture %" fill={GREEN}  fillOpacity={0.65} radius={[3,3,0,0]}/>
                    <Bar dataKey="risk"     name="Risque %"     fill={RED}    fillOpacity={0.60} radius={[3,3,0,0]}/>
                    <Bar dataKey="pressure" name="Pression ×10" fill={BLUE}   fillOpacity={0.60} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {tab==="radar"&&(
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))"/>
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}}/> 
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:8,fill:"hsl(var(--muted-foreground))"}}/> 
                    <Radar name="Réseau" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} strokeWidth={1.5}/>
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {metrics.zonesAtRisk>0&&(
            <div className="sc px-3 py-2 flex items-center gap-3 shrink-0" style={{borderColor:`${RED}44`,background:`${RED}08`}}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{color:RED}}/>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold" style={{color:RED}}>{metrics.zonesAtRisk} zone{metrics.zonesAtRisk>1?"s":""}</span> en déficit :&nbsp;
                {zones.filter(z=>z.coverage<70).map(z=>z.zone).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
