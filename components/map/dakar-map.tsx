"use client"

import dynamic from "next/dynamic"

export const DakarMap = dynamic(
  () => import("./dakar-map-client").then((mod) => mod.DakarMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-border/60 bg-background text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
)
