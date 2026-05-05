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

    const { name, description, duration, price, location } = await request.json()

    const eventType = await prisma.eventType.create({
      data: {
        titre: name,
        description: description || "",
        duree: duration,
        prix: price,
        lieu: location,
        userId: session.user.id,
      }
    })

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

    const eventTypes = await prisma.eventType.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error("Get event types error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de rendez-vous" },
      { status: 500 }
    )
  }
}
