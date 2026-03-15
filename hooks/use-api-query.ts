"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: Dispatch<SetStateAction<T>>
}

export function useApiQuery<T>(url: string, initialData: T): QueryState<T> {
  const [data, setData]       = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const latestUrl = useRef(url)
  const hasData   = useRef(false)

  const fetchData = useCallback(async (targetUrl: string) => {
    if (!targetUrl) {
      setLoading(false)
      return
    }

    // Affiche le spinner uniquement au tout premier chargement
    // Les refetch (avec _r=, actualiser, etc.) gardent les données existantes visibles
    if (!hasData.current) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(targetUrl, {
        credentials: "include",
        cache: "no-store",
      })

      // Ignorer les réponses périmées si une nouvelle requête a déjà démarré
      if (latestUrl.current !== targetUrl) return

      const json = (await response.json()) as T & { error?: string }

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          window.location.href = "/auth/login"
          return
        }
        throw new Error(json.error ?? `Erreur API (${response.status})`)
      }

      setData(json)
      hasData.current = true
      setError(null)
    } catch (requestError) {
      // En cas d'erreur, on garde les données précédentes — on n'efface pas
      if (latestUrl.current === targetUrl) {
        setError(requestError instanceof Error ? requestError.message : "Erreur inconnue")
      }
    } finally {
      if (latestUrl.current === targetUrl) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    latestUrl.current = url

    // Ne pas réinitialiser hasData si c'est juste un refresh forcé (_r=)
    // Cela évite le flash blanc lors des actualisations après updateStatus
    const isForceRefresh = url.includes("_r=") || url.includes("_k=")
    if (!isForceRefresh) {
      hasData.current = false
    }

    void fetchData(url)
  }, [url, fetchData])

  const refetch = useCallback(async () => {
    await fetchData(latestUrl.current)
  }, [fetchData])

  return { data, loading, error, refetch, setData }
}
