import { NextResponse } from "next/server"
import { getDb } from "@/lib/server/db"
import { getUserFromRequest } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    const db = await getDb()

    // Vérifier que les tables existent
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as Array<{ name: string }>
    const tableNames = tables.map(t => t.name)

    const hasCitizenPoints = tableNames.includes("citizen_points")
    const hasCitizenBadges = tableNames.includes("citizen_badges")

    // Compter les incidents
    const incidentCount = db.prepare("SELECT COUNT(*) as c FROM incidents").get() as { c: number }

    // Si l'user est connecté, vérifier ses points
    let userPoints = null
    let userIncidents = null
    if (user) {
      const pts = db.prepare(
        "SELECT * FROM citizen_points WHERE user_id = ? ORDER BY awarded_at DESC"
      ).all(user.id)
      const incs = db.prepare(
        "SELECT id, reporter_user_id, status, created_at FROM incidents WHERE reporter_user_id = ? ORDER BY created_at DESC LIMIT 5"
      ).all(user.id) as any[]
      userPoints = pts
      userIncidents = incs
    }

    return NextResponse.json({
      tables: tableNames,
      hasCitizenPoints,
      hasCitizenBadges,
      totalIncidents: incidentCount.c,
      currentUser: user ? { id: user.id, name: user.name, role: user.role } : null,
      userPoints,
      userIncidents,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
