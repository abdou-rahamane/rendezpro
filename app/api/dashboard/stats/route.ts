import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch username
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    })

    const now = new Date()
    
    // Aujourd'hui
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    // Ce mois
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Requêtes simples une par une
    const todayCount = await prisma.booking.count({
      where: {
        userId,
        date: { gte: todayStart, lte: todayEnd },
      },
    })

    const monthCount = await prisma.booking.count({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
    })

    const todayBookings = await prisma.booking.findMany({
      where: {
        userId,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: {
        eventType: true,
      },
      orderBy: { date: 'asc' },
      take: 10,
    })

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        userId,
        date: { gte: now },
      },
      include: {
        eventType: true,
      },
      orderBy: { date: 'asc' },
      take: 3,
    })

    return NextResponse.json({
      username: currentUser?.username ?? null,
      stats: {
        todayCount,
        monthCount,
      },
      todayBookings: todayBookings.map(b => ({
        id: b.id,
        client: b.clientNom,
        type: b.eventType?.titre || "Type inconnu",
        time: b.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: b.statut,
      })),
      upcomingBookings: upcomingBookings.map(b => ({
        id: b.id,
        client: b.clientNom,
        dateTime: b.date.toLocaleDateString('fr-FR') + ' - ' + b.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration: b.eventType?.duree || 60,
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
