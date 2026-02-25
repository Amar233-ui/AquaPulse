import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="bg-foreground py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {"Pret a transformer la gestion de votre reseau d'eau ?"}
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-primary-foreground/70">
            {"Rejoignez les collectivites qui utilisent AquaPulse pour une gestion plus intelligente, resiliente et durable de l'eau."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/operateur">
                {"Demander une Demo"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/citoyen">
                Espace Citoyen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
