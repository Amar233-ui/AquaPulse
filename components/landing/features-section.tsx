import { Brain, Wrench, Activity, Users, Shield, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "Diagnostic IA",
    description: "Analyse intelligente des donnees pour detecter les anomalies et optimiser les performances du reseau hydraulique.",
  },
  {
    icon: Wrench,
    title: "Maintenance Predictive",
    description: "Anticipez les pannes avant qu'elles ne surviennent grace a des algorithmes de machine learning avances.",
  },
  {
    icon: Activity,
    title: "Surveillance Temps Reel",
    description: "Monitoring continu de l'ensemble du reseau avec des capteurs IoT connectes et des alertes instantanees.",
  },
  {
    icon: Users,
    title: "Gouvernance Citoyenne",
    description: "Interface participative permettant aux citoyens de suivre la qualite de l'eau et de signaler les problemes.",
  },
  {
    icon: Shield,
    title: "Securite & Resilience",
    description: "Protection avancee des infrastructures critiques avec des simulations de stress hydrique et des plans d'urgence.",
  },
  {
    icon: Zap,
    title: "Jumeau Numerique",
    description: "Replique virtuelle complete du reseau pour simuler, analyser et optimiser les operations en temps reel.",
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Fonctionnalites</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {"Une plateforme complete pour la gestion de l'eau"}
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {"AquaPulse combine l'intelligence artificielle, l'IoT et le jumeau numerique pour transformer la gestion hydrique."}
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group border border-border/60 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
