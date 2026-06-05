import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const { name, description, duration, price, location, typeRDV, maxParticipants, heureFixe } = await request.json()

    if (!typeRDV || !['individuel', 'collectif'].includes(typeRDV)) {
      return NextResponse.json({ error: "Le type de RDV est obligatoire (individuel ou collectif)" }, { status: 400 })
    }
    if (typeRDV === 'collectif' && (!maxParticipants || maxParticipants < 2)) {
      return NextResponse.json({ error: "Un RDV collectif doit avoir au moins 2 participants maximum" }, { status: 400 })
    }

    const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const now = new Date()

    await prisma.$executeRawUnsafe(
      `INSERT INTO "EventType" (id, titre, description, duree, prix, lieu, "typeRDV", "maxParticipants", "heureFixe", actif, "userId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12)`,
      id, name, description || "", duration, price, location,
      typeRDV,
      typeRDV === 'collectif' ? (maxParticipants || null) : null,
      typeRDV === 'collectif' ? (heureFixe || null) : null,
      session.user.id, now, now
    )

    const [eventType] = await prisma.$queryRawUnsafe(
      `SELECT id, titre, description, duree, prix, lieu, "typeRDV", "maxParticipants", "heureFixe", actif FROM "EventType" WHERE id = $1`, id
    ) as any[]

    return NextResponse.json({
      message: "Type de rendez-vous créé avec succès",
      eventType
    })
  } catch (error) {
    console.error("Create event type error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du type de rendez-vous" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const eventTypes = await prisma.$queryRawUnsafe(
      `SELECT et.id, et.titre, et.description, et.duree, et.prix, et.lieu, et."typeRDV", et."maxParticipants", et."heureFixe", et.actif, et."createdAt",
        (SELECT COUNT(*) FROM "Booking" b WHERE b."eventTypeId" = et.id) AS "_bookingCount"
       FROM "EventType" et
       WHERE et."userId" = $1
       ORDER BY et."createdAt" ASC`,
      session.user.id
    ) as any[]

    const formatted = eventTypes.map(({ _bookingCount, ...et }) => ({
      ...et,
      duree: Number(et.duree),
      prix: Number(et.prix),
      maxParticipants: et.maxParticipants != null ? Number(et.maxParticipants) : null,
      _count: { bookings: Number(_bookingCount) },
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Get event types error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de rendez-vous" },
      { status: 500 }
    )
  }
}
