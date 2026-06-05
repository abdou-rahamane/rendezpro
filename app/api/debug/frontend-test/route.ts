import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Simuler exactement ce que le frontend appelle
    const query = ''
    const category = null
    const city = null
    const minPrice = null
    const maxPrice = null
    const rating = null
    const sortBy = 'pertinence'
    const page = 1
    const limit = 20

    console.log('=== TEST FRONTEND API CALL ===')
    console.log('Params:', { query, category, city, minPrice, maxPrice, rating, sortBy, page, limit })

    // Clause where exacte
    const where: any = {
      eventTypes: {
        some: {}
      }
    }

    if (query && query.trim()) {
      where.OR = [
        { prenom: { contains: query, mode: 'insensitive' } },
        { nom: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    }

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

    console.log('Professionnels trouvés:', professionals.length)
    professionals.forEach(p => {
      console.log(`  - ${p.prenom} ${p.nom}: ${p.eventTypes.length} types`)
    })

    // Transformer comme l'API
    const transformedPros = professionals.map((pro: any) => {
      const tarifMoyen = pro.eventTypes.length > 0
        ? Math.round(pro.eventTypes.reduce((sum: number, type: any) => sum + type.prix, 0) / pro.eventTypes.length)
        : null

      return {
        id: pro.id,
        prenom: pro.prenom,
        nom: pro.nom,
        username: pro.username,
        bio: pro.bio || 'Professionnel passionné par son métier',
        photo: pro.photo,
        specialite: pro.eventTypes[0]?.titre || 'Professionnel',
        ville: 'Non spécifié',
        tarifMoyen,
        noteMoyenne: 4.5,
        totalAvis: 0,
        verification: true,
        experience: null,
        eventTypes: pro.eventTypes,
        nextDispo: null,
        stats: {
          totalRDV: pro._count.bookings,
          tauxConfirmation: 90
        }
      }
    })

    console.log('Après transformation:', transformedPros.length)
    transformedPros.forEach(p => {
      console.log(`  - ${p.prenom} ${p.nom}: tarif=${p.tarifMoyen}, specialite=${p.specialite}`)
    })

    // Filtrage (même si vide)
    let filteredPros = transformedPros
    if (minPrice) {
      filteredPros = filteredPros.filter((pro: any) => pro.tarifMoyen && pro.tarifMoyen >= parseInt(minPrice))
    }
    if (maxPrice) {
      filteredPros = filteredPros.filter((pro: any) => pro.tarifMoyen && pro.tarifMoyen <= parseInt(maxPrice))
    }

    console.log('Après filtres:', filteredPros.length)

    return NextResponse.json({
      success: true,
      professionals: filteredPros,
      debug: {
        rawCount: professionals.length,
        transformedCount: transformedPros.length,
        filteredCount: filteredPros.length,
        zakariaInRaw: professionals.some(p => p.id === 'cmoss1woj0007bphrjfgdqxnl'),
        zakariaInTransformed: transformedPros.some(p => p.id === 'cmoss1woj0007bphrjfgdqxnl'),
        zakariaInFiltered: filteredPros.some(p => p.id === 'cmoss1woj0007bphrjfgdqxnl')
      }
    })
  } catch (error) {
    console.error('Frontend test error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
