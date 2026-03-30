"use client"

import { useEffect } from "react"

import type { NotificationCategory } from "@/lib/types"

export function useMarkNotificationsViewed(categories: NotificationCategory[]) {
  useEffect(() => {
    if (categories.length === 0) {
      return
    }

    let cancelled = false

    async function markViewed() {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ categories }),
        })

        if (!cancelled) {
          window.dispatchEvent(new Event("notifications:refresh"))
        }
      } catch {}
    }

    void markViewed()
    return () => {
      cancelled = true
    }
  }, [categories.join("|")])
}
