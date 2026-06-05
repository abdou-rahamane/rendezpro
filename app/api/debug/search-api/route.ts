import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Exactement la même requête que l'API recherche
    const query = ''
    const category = null
    const city = null
    const minPrice = null
    const maxPrice = null
    const rating = null
    const sortBy = 'pertinence'
    const page = 1
    const limit = 20

    // Construire la clause where exactement comme dans l'API
    const where: any = {
      eventTypes: {
        some: {
          actif: true
        }
      }
    }

    if (query) {
      where.OR = [
        { prenom: { contains: query, mode: 'insensitive' } },
        { nom: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    }

    console.log('WHERE clause:', JSON.stringify(where, null, 2))

    const professionals = await prisma.user.findMany({
      where,
      include: {
        eventTypes: {
          where: { actif: true },
          select: {
            id: true,
            titre: true,
            description: true,
            duree: true,
            prix: true,
            lieu: true
          }
        },
        bookings: {
          select: {
            id: true,
            statut: true,
            date: true
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                statut: 'confirmed'
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    console.log('Found professionals:', professionals.map(p => ({ id: p.id, name: `${p.prenom} ${p.nom}`, eventTypesCount: p.eventTypes.length })))

    return NextResponse.json({
      where,
      foundCount: professionals.length,
      professionals: professionals.map(pro => ({
        id: pro.id,
        name: `${pro.prenom} ${pro.nom}`,
        username: pro.username,
        eventTypesCount: pro.eventTypes.length,
        eventTypes: pro.eventTypes.map(et => ({ id: et.id, titre: et.titre, actif: true }))
      }))
    })
  } catch (error) {
    console.error('Search API debug error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
