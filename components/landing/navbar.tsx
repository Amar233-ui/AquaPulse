"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AquaPulseLogo } from "@/components/aquapulse-logo"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const navLinks = [
  { label: "Fonctionnalites", href: "#features" },
  { label: "Comment ca marche", href: "#how-it-works" },
  { label: "Espace Citoyen", href: "/citoyen" },
  { label: "Operateur", href: "/operateur" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-primary-foreground/10 bg-foreground/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <AquaPulseLogo size="sm" className="text-primary-foreground" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link href="/admin">Admin</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/operateur">Dashboard</Link>
          </Button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-primary-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-primary-foreground/10 bg-foreground md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              <Button asChild variant="ghost" size="sm" className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href="/admin">Admin</Link>
              </Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/operateur">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
