import { NextResponse } from "next/server"

import { getNotificationCount } from "@/lib/server/data-service"
import { getUserFromRequest } from "@/lib/server/session"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const notifications = await getNotificationCount(user.role)
  return NextResponse.json({ user, notifications })
}
