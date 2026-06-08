import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'event type appartient à l'utilisateur
    const [eventType] = await prisma.$queryRawUnsafe(
      `SELECT id FROM "EventType" WHERE id = $1 AND "userId" = $2`,
      params.id, session.user.id
    ) as any[]

    if (!eventType) {
      return NextResponse.json({ error: "Type de RDV introuvable" }, { status: 404 })
    }

    const { slots = [] } = await request.json()

    const created = []
    for (const slot of slots) {
      if (!slot.dateDebut || !slot.dateFin) continue
      const slotId = `cuid_${Date.now()}_${Math.random().toString(36).slice(2)}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "EventTypeSlot" (id, "eventTypeId", "dateDebut", "dateFin", "createdAt")
         VALUES ($1, $2, $3, $4, $5)`,
        slotId,
        params.id,
        new Date(slot.dateDebut),
        new Date(slot.dateFin),
        new Date()
      )
      created.push({ id: slotId, dateDebut: slot.dateDebut, dateFin: slot.dateFin })
    }

    const allSlots = await prisma.$queryRawUnsafe(
      `SELECT id, "dateDebut", "dateFin" FROM "EventTypeSlot"
       WHERE "eventTypeId" = $1 ORDER BY "dateDebut" ASC`,
      params.id
    ) as any[]

    return NextResponse.json({ message: "Créneaux ajoutés", slots: allSlots })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { slotId } = await request.json()

    // Vérifier ownership via eventType
    const [slot] = await prisma.$queryRawUnsafe(
      `SELECT ets.id FROM "EventTypeSlot" ets
       INNER JOIN "EventType" et ON et.id = ets."eventTypeId"
       WHERE ets.id = $1 AND et."userId" = $2`,
      slotId, session.user.id
    ) as any[]

    if (!slot) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 })
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "EventTypeSlot" WHERE id = $1`,
      slotId
    )

    return NextResponse.json({ message: "Créneau supprimé" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
