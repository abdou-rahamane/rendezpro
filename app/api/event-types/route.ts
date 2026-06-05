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

    const { name, description, duration, price, location, typeRDV, maxParticipants, heureFixe, slots = [] } = await request.json()

    if (!typeRDV || !['individuel', 'collectif'].includes(typeRDV)) {
      return NextResponse.json({ error: "Le type de RDV est obligatoire (individuel ou collectif)" }, { status: 400 })
    }
    if (typeRDV === 'collectif' && (!maxParticipants || maxParticipants < 2)) {
      return NextResponse.json({ error: "Un RDV collectif doit avoir au moins 2 participants maximum" }, { status: 400 })
    }

    // Vérification des conflits AMÉLIORÉE
    async function checkConflicts(userId: string, slots: any[], excludeEventTypeId?: string) {
      const conflicts = []
      
      for (const slot of slots) {
        if (!slot.dateDebut || !slot.dateFin) continue
        
        // 1. Vérifier les réservations existantes
        const conflictingBookings = await prisma.$queryRawUnsafe(
          `SELECT b.id, et.titre, b.date
           FROM "Booking" b
           INNER JOIN "EventType" et ON b."eventTypeId" = et.id
           WHERE b."userId" = $1
             AND b.statut != 'cancelled'
             AND b.date >= $2
             AND b.date <= $3`,
          userId, new Date(slot.dateDebut), new Date(slot.dateFin)
        ) as any[]
        
        if (conflictingBookings.length > 0) {
          conflicts.push({
            slot,
            type: 'booking',
            message: 'Conflit avec une réservation existante',
            conflicts: conflictingBookings
          })
        }
        
        // 2. Vérifier les autres types de RDV avec des créneaux similaires
        const conflictingEventTypes = await prisma.$queryRawUnsafe(
          `SELECT et.id, et.titre, ets."dateDebut", ets."dateFin"
           FROM "EventType" et
           INNER JOIN "EventTypeSlot" ets ON et.id = ets."eventTypeId"
           WHERE et."userId" = $1
             AND et.actif = true
             ${excludeEventTypeId ? `AND et.id != $4` : ''}
             AND (
               (ets."dateDebut" <= $3 AND ets."dateFin" >= $2)
             )`,
          excludeEventTypeId ? [userId, new Date(slot.dateDebut), new Date(slot.dateFin), excludeEventTypeId] 
          : [userId, new Date(slot.dateDebut), new Date(slot.dateFin)]
        ) as any[]
        
        if (conflictingEventTypes.length > 0) {
          conflicts.push({
            slot,
            type: 'event_type',
            message: 'Conflit avec un autre type de RDV',
            conflicts: conflictingEventTypes
          })
        }
      }
      
      return conflicts
    }

    const conflicts = await checkConflicts(session.user.id, slots)
    if (conflicts.length > 0) {
      return NextResponse.json({
        error: 'Conflits détectés',
        conflicts
      }, { status: 409 })
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

    // Créer les slots
    if (slots.length > 0) {
      for (const slot of slots) {
        if (slot.dateDebut && slot.dateFin) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "EventTypeSlot" (id, "eventTypeId", "dateDebut", "dateFin", "createdAt")
             VALUES ($1, $2, $3, $4, $5)`,
            `cuid_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            id,
            new Date(slot.dateDebut),
            new Date(slot.dateFin),
            new Date()
          )
        }
      }
    }

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
