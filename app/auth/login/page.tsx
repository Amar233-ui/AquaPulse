"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

import { AquaPulseLogo } from "@/components/aquapulse-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserRole } from "@/lib/types"

const ROLE_HOME: Record<UserRole, string> = {
  citoyen: "/citoyen",
  operateur: "/operateur",
  admin: "/admin",
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nextPath, setNextPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next")
    setNextPath(next)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const json = (await response.json()) as {
        error?: string
        user?: { role: UserRole }
      }

      if (!response.ok || !json.user) {
        throw new Error(json.error ?? "Connexion echouee")
      }

      if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        router.push(nextPath)
      } else {
        router.push(ROLE_HOME[json.user.role])
      }

      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-10">
      <Card className="w-full max-w-md border border-border/60 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <AquaPulseLogo />
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Accedez a votre espace AquaPulse.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@aquapulse.io"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="font-medium text-accent hover:underline">
              Creer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
