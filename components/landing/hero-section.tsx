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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Plateforme de Jumeau Numerique
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            {"AquaPulse \u2013 Gestion Resiliente de l'Eau par l'IA"}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/70">
            {"Jumeau numerique intelligent pour une gestion resiliente de l'eau. Diagnostic IA, maintenance predictive et surveillance en temps reel de votre infrastructure hydrique."}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/operateur">
                {"Decouvrir la Plateforme"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/citoyen">
                <Play className="h-4 w-4" />
                Espace Citoyen
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: "99.7%", label: "Disponibilite" },
            { value: "2,400+", label: "Capteurs IoT" },
            { value: "-35%", label: "Fuites Detectees" },
            { value: "24/7", label: "Surveillance" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-accent sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-primary-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
