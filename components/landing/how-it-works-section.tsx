import { Radio, Cpu, BarChart3, Shield } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Radio,
    title: "Collecte des Donnees",
    description: "Les capteurs IoT deployes sur l'ensemble du reseau collectent en continu les donnees de debit, pression, qualite et temperature.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Analyse IA",
    description: "Nos algorithmes de machine learning analysent les donnees en temps reel pour detecter les anomalies et predire les defaillances.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Visualisation",
    description: "Le jumeau numerique offre une vue complete du reseau avec des tableaux de bord interactifs et des alertes intelligentes.",
  },
  {
    step: "04",
    icon: Shield,
    title: "Action & Prevention",
    description: "Les equipes interviennent de maniere proactive grace aux recommandations IA et aux plans de maintenance predictive.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Comment ca marche</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            De la donnee brute a la decision intelligente
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <item.icon className="h-6 w-6 text-accent" />
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-accent">{item.step}</p>
              <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
