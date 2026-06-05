import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer tous les utilisateurs avec leurs types de RDV
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        prenom: true,
        nom: true,
        username: true,
        email: true,
        _count: {
          select: {
            eventTypes: {
              where: { actif: true }
            },
            bookings: true
          }
        },
        eventTypes: {
          where: { actif: true },
          select: {
            id: true,
            titre: true,
            prix: true,
            actif: true
          }
        }
      }
    })

    return NextResponse.json({
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        id: user.id,
        name: `${user.prenom} ${user.nom}`,
        username: user.username,
        email: user.email,
        eventTypesCount: user._count.eventTypes,
        bookingsCount: user._count.bookings,
        eventTypes: user.eventTypes
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: "Erreur debug" },
      { status: 500 }
    )
  }
}
