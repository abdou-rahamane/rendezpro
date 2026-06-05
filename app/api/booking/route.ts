import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToPro,
} from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { 
      clientNom, 
      clientEmail, 
      clientTel, 
      clientMsg, 
      date, 
      eventTypeId,
      userId 
    } = await request.json()

    // --- Règle métier : détection de conflit de créneau ---
    const [eventTypeRow] = await prisma.$queryRawUnsafe(
      `SELECT duree, "typeRDV", "maxParticipants" FROM "EventType" WHERE id = $1`,
      eventTypeId
    ) as any[]

    if (!eventTypeRow) {
      return NextResponse.json({ error: "Type de RDV introuvable" }, { status: 404 })
    }

    const bookingStart = new Date(date)
    const bookingEnd = new Date(bookingStart.getTime() + eventTypeRow.duree * 60 * 1000)

    // Chercher des bookings confirmés du même professionnel qui chevauchent le créneau
    const conflicts = await prisma.$queryRawUnsafe(
      `SELECT b.id, et."typeRDV", et."maxParticipants", et.id as "etId"
       FROM "Booking" b
       INNER JOIN "EventType" et ON b."eventTypeId" = et.id
       WHERE b."userId" = $1
         AND b.statut != 'cancelled'
         AND b.date < $2
         AND (b.date + (et.duree * INTERVAL '1 minute')) > $3`,
      userId, bookingEnd.toISOString(), bookingStart.toISOString()
    ) as any[]

    if (eventTypeRow.typeRDV === 'individuel') {
      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: "Ce créneau est déjà réservé. Veuillez choisir un autre horaire." },
          { status: 409 }
        )
      }
    } else if (eventTypeRow.typeRDV === 'collectif') {
      const sameSlotCount = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "Booking"
         WHERE "eventTypeId" = $1 AND statut != 'cancelled'`,
        eventTypeId
      ) as any[]
      const current = Number(sameSlotCount[0]?.count || 0)
      if (current >= (eventTypeRow.maxParticipants || 1)) {
        return NextResponse.json(
          { error: `Ce RDV collectif est complet (${eventTypeRow.maxParticipants} participants max).` },
          { status: 409 }
        )
      }
    }
    // --- Fin règle métier ---

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientNom,
        clientEmail,
        clientTel,
        clientMsg,
        date: new Date(date),
        eventTypeId,
        userId,
      },
      include: {
        eventType: true,
        user: true,
      }
    })

    const emailData = {
      clientNom: booking.clientNom,
      clientEmail: booking.clientEmail,
      clientTel: booking.clientTel,
      clientMsg: booking.clientMsg,
      proNom: booking.user.nom,
      proPrenom: booking.user.prenom,
      eventTypeTitle: booking.eventType.titre,
      date: booking.date,
      bookingId: booking.id,
    }

    const [clientResult, proResult] = await Promise.allSettled([
      sendBookingConfirmationToClient(emailData),
      sendBookingNotificationToPro(emailData, booking.user.email),
    ])

    if (clientResult.status === "rejected") {
      console.error("❌ Email client échoué:", clientResult.reason)
    } else {
      console.log("✅ Email client envoyé:", clientResult.value)
    }

    if (proResult.status === "rejected") {
      console.error("❌ Email pro échoué:", proResult.reason)
    } else {
      console.log("✅ Email pro envoyé:", proResult.value)
    }

    return NextResponse.json({
      message: "Rendez-vous créé avec succès",
      booking
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth/next")
    const { authOptions } = await import("@/lib/auth")
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = { userId: session.user.id }
    if (statusFilter) where.statut = statusFilter
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { eventType: true },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous" },
      { status: 500 }
    )
  }
}
