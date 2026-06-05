import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test direct avec l'ID de Zakaria
    const zakaria = await prisma.user.findUnique({
      where: { id: 'cmoss1woj0007bphrjfgdqxnl' },
      include: {
        eventTypes: true
      }
    })
    
    // Test tous les users avec eventTypes
    const allWithEvents = await prisma.user.findMany({
      where: {
        eventTypes: {
          some: {}
        }
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        username: true,
        _count: {
          select: {
            eventTypes: true
          }
        }
      }
    })
    
    return NextResponse.json({
      zakariaFound: !!zakaria,
      zakariaData: zakaria ? {
        id: zakaria.id,
        name: `${zakaria.prenom} ${zakaria.nom}`,
        eventTypesCount: zakaria.eventTypes.length,
        eventTypes: zakaria.eventTypes
      } : null,
      allWithEventsCount: allWithEvents.length,
      allWithEvents: allWithEvents.map(u => ({
        id: u.id,
        name: `${u.prenom} ${u.nom}`,
        eventTypesCount: u._count.eventTypes
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
