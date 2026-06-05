import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendCancellationEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true, user: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Rendez-vous introuvable" },
        { status: 404 }
      )
    }

    if (booking.statut === "cancelled") {
      return NextResponse.json(
        { error: "Ce rendez-vous est déjà annulé" },
        { status: 400 }
      )
    }

    await prisma.booking.update({
      where: { id },
      data: { statut: "cancelled" },
    })

    await sendCancellationEmail({
      clientNom: booking.clientNom,
      clientEmail: booking.clientEmail,
      eventTypeTitle: booking.eventType.titre,
      date: booking.date,
    }).catch((err) => console.error("Cancel email error:", err))

    return NextResponse.json({ message: "Rendez-vous annulé avec succès" })
  } catch (error) {
    console.error("Cancel booking error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 }
    )
  }
}
