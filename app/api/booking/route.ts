import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    const where: any = { userId: session.user.id }
    if (statusFilter) where.statut = statusFilter

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
