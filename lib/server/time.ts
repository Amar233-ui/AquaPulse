export function formatRelativeTime(isoDate: string): string {
  const now = Date.now()
  const date = new Date(isoDate).getTime()
  const diffMs = now - date

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "A l'instant"
  }

  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 1) {
    return "A l'instant"
  }

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `Il y a ${diffHours}h`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) {
    return `Il y a ${diffDays}j`
  }

  return new Date(isoDate).toISOString().slice(0, 10)
}

export function toDisplayDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return date.toISOString().slice(0, 16).replace("T", " ")
}

export function hourLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return "--h"
  }

  return `${date.getHours().toString().padStart(2, "0")}h`
}

export function weekDayLabel(isoDate: string): string {
  const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return labels[date.getDay()]
}
