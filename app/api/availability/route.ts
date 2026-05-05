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

    const { dayOfWeek, startTime, endTime, isActive } = await request.json()

    // Créer une nouvelle disponibilité
    const availability = await prisma.availability.create({
      data: {
        jour: dayOfWeek.toString(),
        heureDebut: startTime,
        heureFin: endTime,
        actif: isActive,
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Disponibilité créée avec succès",
      availability
    })
  } catch (error) {
    console.error("Create availability error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
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

    const availabilities = await prisma.availability.findMany({
      where: { userId: session.user.id },
      orderBy: { jour: "asc" }
    })

    return NextResponse.json(availabilities)
  } catch (error) {
    console.error("Get availability error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { schedule } = await request.json()
    const userId = session.user.id

    // Supprimer toutes les disponibilités existantes et recréer
    await prisma.availability.deleteMany({ where: { userId } })

    const created = await prisma.availability.createMany({
      data: schedule
        .filter((s: any) => s.isActive)
        .map((s: any) => ({
          jour: s.dayOfWeek.toString(),
          heureDebut: s.startTime,
          heureFin: s.endTime,
          actif: true,
          userId,
        }))
    })

    return NextResponse.json({ message: "Disponibilités sauvegardées", count: created.count })
  } catch (error) {
    console.error("Update availability error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des disponibilités" },
      { status: 500 }
    )
  }
}
