import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.id, actif: true },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            bio: true,
          }
        }
      }
    })

    if (!eventType) {
      return NextResponse.json({ error: "Type de RDV introuvable" }, { status: 404 })
    }

    // Récupérer les disponibilités du professionnel
    const availabilities = await prisma.availability.findMany({
      where: { userId: eventType.userId, actif: true },
      orderBy: { jour: "asc" }
    })

    return NextResponse.json({ eventType, availabilities })
  } catch (error) {
    console.error("Public event type error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    )
  }
}
