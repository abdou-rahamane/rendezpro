import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["confirmed", "cancelled", "pending"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params
    const { statut } = await request.json()

    if (!VALID_STATUSES.includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return NextResponse.json(
        { error: "Rendez-vous introuvable" },
        { status: 404 }
      )
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { statut },
      include: { eventType: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update status error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    )
  }
}
