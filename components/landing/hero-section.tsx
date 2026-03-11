import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-water.jpg"
          alt="Infrastructure intelligente de gestion de l'eau"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/80 to-foreground" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pb-32 lg:pt-44">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Plateforme de Jumeau Numérique — Dakar, Sénégal
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            AquaPulse — Gestion Résiliente de l'Eau par l'IA
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/80">
            Jumeau numérique intelligent pour une gestion résiliente de l'eau. Détection de fuites, maintenance prédictive et surveillance en temps réel de votre infrastructure hydrique.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <Link href="/auth/login">
                Découvrir la Plateforme
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/auth/register">
                <Play className="h-4 w-4" />
                Espace Citoyen
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats — fond opaque pour lisibilité garantie */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: "99.7%",  label: "Disponibilité",       sub: "uptime réseau" },
            { value: "2 400+", label: "Capteurs IoT",         sub: "déployés" },
            { value: "−35%",   label: "Fuites Détectées",     sub: "vs méthode manuelle" },
            { value: "24/7",   label: "Surveillance",         sub: "temps réel" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-accent sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-primary-foreground">{stat.label}</p>
              <p className="text-xs text-primary-foreground/60 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
