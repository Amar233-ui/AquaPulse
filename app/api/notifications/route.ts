import { NextResponse } from "next/server"

import type { NotificationCategory } from "@/lib/types"
import { getUnreadNotifications, markNotificationsViewed } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

const VALID_CATEGORIES: NotificationCategory[] = ["alertes", "signalements", "maintenance", "eah"]

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const items = await getUnreadNotifications(user)

    return NextResponse.json({
      items,
      unread: items.length,
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    const body = (await request.json().catch(() => ({}))) as { categories?: string[] }
    const categories = (body.categories ?? []).filter((category): category is NotificationCategory =>
      VALID_CATEGORIES.includes(category as NotificationCategory),
    )

    await markNotificationsViewed(user.id, categories)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
