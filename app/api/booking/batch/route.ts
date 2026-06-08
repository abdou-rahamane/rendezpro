import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMultiSlotConfirmationToClient, sendMultiSlotNotificationToPro } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const {
      clientNom,
      clientEmail,
      clientTel,
      clientMsg,
      eventTypeId,
      userId,
      slots,   // Array<{ date: string; dateFin?: string; slotId?: string }>
    } = await request.json()

    if (!slots || slots.length === 0) {
      return NextResponse.json({ error: "Aucun créneau fourni" }, { status: 400 })
    }

    const [eventTypeRow] = await prisma.$queryRawUnsafe(
      `SELECT et.id, et.duree, et.titre, et."typeRDV", et."maxParticipants",
              u.nom, u.prenom, u.email as "proEmail"
       FROM "EventType" et
       INNER JOIN "User" u ON u.id = et."userId"
       WHERE et.id = $1`,
      eventTypeId
    ) as any[]

    if (!eventTypeRow) {
      return NextResponse.json({ error: "Type de RDV introuvable" }, { status: 404 })
    }

    const createdBookings: any[] = []

    for (const slot of slots) {
      const bookingDate = new Date(slot.date)
      const bookingEnd = new Date(bookingDate.getTime() + Number(eventTypeRow.duree) * 60 * 1000)

      // Vérification conflit
      const conflicts = await prisma.$queryRawUnsafe(
        `SELECT b.id FROM "Booking" b
         INNER JOIN "EventType" et ON b."eventTypeId" = et.id
         WHERE b."userId" = $1
           AND b.statut != 'cancelled'
           AND b.date < $2::timestamp
           AND (b.date + (et.duree * INTERVAL '1 minute')) > $3::timestamp`,
        userId, bookingEnd.toISOString(), bookingDate.toISOString()
      ) as any[]

      if (eventTypeRow.typeRDV === 'individuel' && conflicts.length > 0) {
        return NextResponse.json(
          { error: `Conflit sur le créneau du ${bookingDate.toLocaleDateString('fr-FR')}` },
          { status: 409 }
        )
      }

      const booking = await prisma.booking.create({
        data: {
          clientNom,
          clientEmail,
          clientTel: clientTel || null,
          clientMsg: clientMsg || null,
          date: bookingDate,
          eventTypeId,
          userId,
        },
      })

      createdBookings.push(booking)
    }

    // Un seul email récapitulatif pour le client
    const emailData = {
      clientNom,
      clientEmail,
      clientTel,
      clientMsg,
      proNom: eventTypeRow.nom,
      proPrenom: eventTypeRow.prenom,
      proEmail: eventTypeRow.proEmail,
      eventTypeTitle: eventTypeRow.titre,
      slots: createdBookings.map((b, i) => ({
        date: new Date(b.date),
        dateFin: slots[i]?.dateFin ? new Date(slots[i].dateFin) : undefined,
        bookingId: b.id,
      })),
    }

    await Promise.allSettled([
      sendMultiSlotConfirmationToClient(emailData),
      sendMultiSlotNotificationToPro(emailData),
    ])

    return NextResponse.json({
      message: `${createdBookings.length} créneau(x) réservé(s)`,
      bookings: createdBookings,
    })

  } catch (error) {
    console.error("Batch booking error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réservation" },
      { status: 500 }
    )
  }
}
