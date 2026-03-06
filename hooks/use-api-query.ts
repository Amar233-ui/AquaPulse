"use client"

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: Dispatch<SetStateAction<T>>
}

export function useApiQuery<T>(url: string, initialData: T): QueryState<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, { credentials: "include", cache: "no-store" })
      const json = (await response.json()) as T & { error?: string }

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          window.location.href = "/auth/login"
        }
        throw new Error(json.error ?? "Erreur API")
      }

      setData(json)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  }
}
