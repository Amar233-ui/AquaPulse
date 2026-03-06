import Link from "next/link"
import { AquaPulseLogo } from "@/components/aquapulse-logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <AquaPulseLogo size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {"Jumeau numerique intelligent pour une gestion resiliente de l'eau."}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Plateforme</h4>
            <ul className="mt-3 space-y-2">
              {["Fonctionnalites", "Jumeau Numerique", "Maintenance Predictive", "Diagnostic IA"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Acces</h4>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Inscription", href: "/auth/register" },
                { label: "Connexion", href: "/auth/login" },
                { label: "Acces Admin", href: "/auth/login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>contact@aquapulse.io</li>
              <li>+33 1 23 45 67 89</li>
              <li>Paris, France</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {"2026 AquaPulse. Tous droits reserves. Plateforme de gestion intelligente de l'eau."}
          </p>
        </div>
      </div>
    </footer>
  )
}
