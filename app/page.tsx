import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ArrowRight, Droplets, Brain, Wrench, Activity, Shield, Zap, Radio, MapPin, Users } from "lucide-react"

export default function HomePage() {
  return (
    <main className="bg-[#080e1a] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        .hero-grid { background-image: linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px); background-size: 60px 60px; }
        .glow-cyan { box-shadow: 0 0 40px rgba(34,211,238,0.15), 0 0 80px rgba(34,211,238,0.05); }
        .stat-card { background: linear-gradient(135deg, rgba(34,211,238,0.07) 0%, rgba(56,189,248,0.04) 100%); border: 1px solid rgba(34,211,238,0.18); }
        .feature-card { background: linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(13,20,40,0.95) 100%); border: 1px solid rgba(255,255,255,0.06); transition: all .3s ease; }
        .feature-card:hover { border-color: rgba(34,211,238,0.25); transform: translateY(-2px); box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(34,211,238,0.05); }
        .step-line::after { content: ''; position: absolute; top: 28px; left: calc(50% + 28px); width: calc(100% - 56px); height: 1px; background: linear-gradient(90deg, rgba(34,211,238,0.4), rgba(34,211,238,0.1)); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
        .float-anim { animation: float 6s ease-in-out infinite; }
        .badge-pulse::before { content:''; position:absolute; inset:0; border-radius:9999px; animation: pulse-ring 2s ease-out infinite; border: 1px solid rgba(34,211,238,0.5); }
        .gradient-text { background: linear-gradient(135deg, #22d3ee 0%, #38bdf8 50%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #0ea5e9, #22d3ee); color: #080e1a; font-weight: 700; transition: all .2s; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,211,238,0.3); }
        .btn-outline { border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.85); transition: all .2s; }
        .btn-outline:hover { border-color: rgba(34,211,238,0.5); color: #22d3ee; background: rgba(34,211,238,0.06); }
        .map-dot { position:absolute; border-radius:50%; background:#22d3ee; animation: pulse-ring 2s ease-out infinite; }
        .pipe { position:absolute; background:linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent); height:1px; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center hero-grid pt-16">
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", pointerEvents: "none" }}/>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div className="relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8 badge-pulse" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] animate-pulse"/>
                Jumeau Numérique 
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Gérez l'eau d'une
                <br/>
                <span className="gradient-text">ville en temps réel</span>
              </h1>

              <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg">
                Plateforme IA de surveillance du réseau hydrique — détection de fuites, maintenance prédictive et participation citoyenne pour la SDE Sénégalaise Des Eaux.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm">
                  Accès Opérateurs <ArrowRight className="h-4 w-4"/>
                </Link>
                <Link href="/auth/register" className="btn-outline inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm">
                  <Users className="h-4 w-4"/> Espace Citoyen
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12">
                {[
                  { value: "120+", label: "Capteurs IoT" },
                  { value: "−35%", label: "Fuites détectées" },
                  { value: "24/7", label: "Surveillance" },
                ].map(s => (
                  <div key={s.label} className="stat-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#22d3ee]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
                    <p className="text-xs text-white/50 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — network visualization */}
            <div className="hidden lg:block relative">
              <div className="float-anim relative mx-auto" style={{ width: 480, height: 420 }}>
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-3xl glow-cyan" style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 70%)" }}/>

                {/* Main card */}
                <div className="absolute inset-4 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, #0d1526, #0a1020)", border: "1px solid rgba(34,211,238,0.15)" }}>
                  {/* Header bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(34,211,238,0.1)" }}>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-[#22d3ee]"/>
                      <span className="text-xs font-bold tracking-widest text-[#22d3ee]">AQUAPULSE — RÉSEAU DAKAR</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"/>
                      <span className="text-[10px] text-white/40">EN LIGNE</span>
                    </div>
                  </div>

                  {/* Network map area */}
                  <div className="relative p-4" style={{ height: 280 }}>
                    {/* Fake map dots — Dakar zones */}
                    {[
                      { x: "22%", y: "55%", label: "Médina",    status: "ok"  },
                      { x: "38%", y: "40%", label: "Plateau",   status: "ok"  },
                      { x: "55%", y: "30%", label: "HLM",       status: "ok"  },
                      { x: "70%", y: "45%", label: "Parcelles", status: "warn"},
                      { x: "80%", y: "65%", label: "Pikine",    status: "ok"  },
                      { x: "50%", y: "62%", label: "Gd Dakar",  status: "crit"},
                      { x: "15%", y: "35%", label: "Fann",      status: "ok"  },
                    ].map(dot => (
                      <div key={dot.label} className="absolute" style={{ left: dot.x, top: dot.y }}>
                        <div className="relative flex items-center justify-center">
                          <div className="absolute h-5 w-5 rounded-full animate-ping opacity-30" style={{ background: dot.status === "crit" ? "#f87171" : dot.status === "warn" ? "#fbbf24" : "#22d3ee" }}/>
                          <div className="relative h-2.5 w-2.5 rounded-full" style={{ background: dot.status === "crit" ? "#f87171" : dot.status === "warn" ? "#fbbf24" : "#22d3ee", boxShadow: `0 0 8px ${dot.status === "crit" ? "#f87171" : dot.status === "warn" ? "#fbbf24" : "#22d3ee"}` }}/>
                          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] text-white/50 whitespace-nowrap">{dot.label}</span>
                        </div>
                      </div>
                    ))}

                    {/* Alert badge */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f87171] animate-pulse"/>
                      <span className="text-[10px] font-semibold text-[#f87171]">2 alertes critiques</span>
                    </div>
                  </div>

                  {/* Bottom metrics bar */}
                  <div className="grid grid-cols-3 border-t" style={{ borderColor: "rgba(34,211,238,0.1)" }}>
                    {[
                      { label: "Débit", value: "3 420 m³/h" },
                      { label: "Pression moy.", value: "3.1 bar" },
                      { label: "Capteurs actifs", value: "114/120" },
                    ].map(m => (
                      <div key={m.label} className="px-4 py-3 border-r last:border-r-0" style={{ borderColor: "rgba(34,211,238,0.08)" }}>
                        <p className="text-[9px] text-white/40 uppercase tracking-wider">{m.label}</p>
                        <p className="text-sm font-bold text-[#22d3ee] mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 lg:py-28" style={{ background: "#060c17" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#22d3ee] mb-3">Fonctionnalités</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Une plateforme complète
              <br className="hidden sm:block"/>
              <span className="gradient-text"> pour la gestion de l'eau</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Brain,    title: "Diagnostic IA",           desc: "Détection automatique des anomalies — fuites, contaminations, fraudes — par analyse acoustique et machine learning en temps réel." },
              { icon: Wrench,   title: "Maintenance Prédictive",   desc: "Anticipez les pannes avant qu'elles surviennent. Planification automatique des interventions avec confiance IA et priorisation." },
              { icon: Activity, title: "Surveillance 24/7",        desc: "120 capteurs IoT déployés sur Dakar mesurent débit, pression, qualité et température en continu avec alertes instantanées." },
              { icon: Users,    title: "Participation Citoyenne",  desc: "Les citoyens signalent des problèmes directement aux opérateurs. Chaque signalement est traité et suivi en temps réel." },
              { icon: Shield,   title: "Simulateur de Stress",     desc: "Simulez sécheresse, inondation, panne ou contamination pour anticiper les risques et préparer des plans de réponse." },
              { icon: Zap,      title: "Jumeau Numérique",         desc: "Réplique virtuelle complète du réseau hydrique de Dakar — 200 conduites, 9 quartiers — pour analyser et optimiser." },
            ].map(f => (
              <div key={f.title} className="feature-card rounded-2xl p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-5" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <f.icon className="h-5 w-5 text-[#22d3ee]"/>
                </div>
                <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 lg:py-28 hero-grid" style={{ background: "#080e1a" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#22d3ee] mb-3">Comment ça marche</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              De la donnée brute<br/>
              <span className="gradient-text">à la décision intelligente</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {[
              { n: "01", icon: Radio,    title: "Collecte IoT",         desc: "120 capteurs déployés sur Dakar mesurent débit, pression, qualité et température en continu." },
              { n: "02", icon: Brain,    title: "Analyse IA",           desc: "Algorithmes de ML analysent les données en temps réel, détectent les anomalies et prédisent les défaillances." },
              { n: "03", icon: MapPin,   title: "Visualisation",        desc: "Jumeau numérique interactif, tableaux de bord temps réel et alertes géolocalisées pour les opérateurs." },
              { n: "04", icon: Shield,   title: "Action & Prévention",  desc: "Les équipes interviennent proactivement grâce aux recommandations IA et aux plans de maintenance prédictive." },
            ].map((s, i) => (
              <div key={s.n} className="relative text-center">
                {/* Connector line (not on last) */}
                {i < 3 && <div className="hidden lg:block absolute top-7 left-[calc(50%+32px)] right-0 h-px" style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.3), rgba(34,211,238,0.05))" }}/>}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4 relative" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <s.icon className="h-6 w-6 text-[#22d3ee]"/>
                </div>
                <p className="text-xs font-bold text-[#22d3ee] uppercase tracking-widest mb-2">{s.n}</p>
                <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-20" style={{ background: "#060c17" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#22d3ee] mb-3">Accès</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Deux espaces, un objectif</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl p-8" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.07), rgba(56,189,248,0.04))", border: "1px solid rgba(34,211,238,0.2)" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-5" style={{ background: "rgba(34,211,238,0.12)" }}>
                <Zap className="h-6 w-6 text-[#22d3ee]"/>
              </div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Espace Opérateur</h3>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">Centre de contrôle complet — alertes IA, jumeau numérique, maintenance prédictive, simulateur, gestion des signalements citoyens.</p>
              <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                Se connecter <ArrowRight className="h-4 w-4"/>
              </Link>
            </div>
            <div className="rounded-2xl p-8" style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.07), rgba(167,139,250,0.04))", border: "1px solid rgba(129,140,248,0.2)" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-5" style={{ background: "rgba(129,140,248,0.12)" }}>
                <Users className="h-6 w-6" style={{ color: "#818cf8" }}/>
              </div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Espace Citoyen</h3>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">Qualité de l'eau par quartier, carte interactive, alertes en cours dans votre secteur. Signalez un problème en 30 secondes.</p>
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", transition: "all .2s" }}>
                Créer un compte <ArrowRight className="h-4 w-4"/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#080e1a" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.07) 0%, transparent 65%)" }}/>
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#22d3ee] mb-6 px-4 py-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <MapPin className="h-3.5 w-3.5"/> SDE — Sénégalaise Des Eaux, Dakar
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Prêt à transformer la<br/>
            <span className="gradient-text">gestion de votre réseau ?</span>
          </h2>
          <p className="text-white/50 mb-8 leading-relaxed">AquaPulse combine IA, IoT et participation citoyenne pour une gestion résiliente et durable de l'eau à Dakar.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm">
              Accéder à la plateforme <ArrowRight className="h-4 w-4"/>
            </Link>
            <Link href="/auth/register" className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm">
              Espace citoyen gratuit
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
