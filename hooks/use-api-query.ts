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

  // Track the latest url to ignore stale responses
  const latestUrl = useRef(url)
  // Track first load vs subsequent refetches
  const hasData = useRef(false)

  const fetchData = useCallback(async (targetUrl: string) => {
    // Skip empty urls (disabled queries)
    if (!targetUrl) {
      setLoading(false)
      return
    }

    // Only show full loading spinner on first fetch
    // On refetch, keep existing data visible (no flash to empty)
    if (!hasData.current) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(targetUrl, {
        credentials: "include",
        cache: "no-store",
      })

      // Ignore if a newer request has already started
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
      // Only show error, don't clear existing data
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
    hasData.current = false
    void fetchData(url)
  }, [url, fetchData])

  const refetch = useCallback(async () => {
    await fetchData(latestUrl.current)
  }, [fetchData])

  return { data, loading, error, refetch, setData }
}
