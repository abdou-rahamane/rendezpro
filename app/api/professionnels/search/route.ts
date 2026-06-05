import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const sortBy = searchParams.get('sortBy') || 'pertinence'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construire les conditions SQL dynamiquement
    const conditions: string[] = []
    const sqlParams: any[] = []
    let paramIdx = 1

    // Filtre texte
    if (query && query.trim()) {
      conditions.push(`(u.prenom ILIKE $${paramIdx} OR u.nom ILIKE $${paramIdx} OR u.username ILIKE $${paramIdx} OR u.bio ILIKE $${paramIdx})`)
      sqlParams.push(`%${query.trim()}%`)
      paramIdx++
    }

    // Filtre catégorie
    if (category && category.trim()) {
      conditions.push(`u.categorie = $${paramIdx}`)
      sqlParams.push(category.trim())
      paramIdx++
    }

    // Filtre ville
    if (city && city.trim()) {
      conditions.push(`u.ville ILIKE $${paramIdx}`)
      sqlParams.push(`%${city.trim()}%`)
      paramIdx++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const rawQuery = `
      SELECT DISTINCT
        u.id, u.prenom, u.nom, u.username, u.bio, u.photo,
        u.email, u.telephone, u."createdAt", u.specialite, u.categorie, u.ville, u."codePostal", u.pays,
        COUNT(DISTINCT b.id) as total_bookings
      FROM "User" u
      INNER JOIN "EventType" et ON u.id = et."userId" AND et.actif = true
      LEFT JOIN "Booking" b ON u.id = b."userId" AND b.statut = 'confirmed'
      ${whereClause}
      GROUP BY u.id, u.prenom, u.nom, u.username, u.bio, u.photo, u.email, u.telephone, u."createdAt", u.specialite, u.categorie, u.ville, u."codePostal", u.pays
      ORDER BY u."createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `
    
    const professionals = sqlParams.length > 0
      ? await prisma.$queryRawUnsafe(rawQuery, ...sqlParams)
      : await prisma.$queryRawUnsafe(rawQuery)
    
    // Récupérer les eventTypes et localisation pour chaque professionnel
    const professionalsWithEventTypes = await Promise.all(
      (professionals as any[]).map(async (pro) => {
        const eventTypes = await prisma.eventType.findMany({
          where: { 
            userId: pro.id,
            actif: true 
          },
          select: {
            id: true,
            titre: true,
            description: true,
            duree: true,
            prix: true,
            lieu: true
          }
        })
        
        return {
          ...pro,
          id: pro.id.toString(),
          eventTypes,
          bookings: [],
          _count: { bookings: parseInt(pro.total_bookings) }
        }
      })
    )

    // Calculer les statistiques et transformer les données
    const transformedPros = professionalsWithEventTypes.map((pro: any) => {
      // Calculer le tarif moyen à partir des types de RDV
      const tarifMoyen = pro.eventTypes.length > 0
        ? pro.eventTypes.reduce((sum: number, type: any) => sum + type.prix, 0) / pro.eventTypes.length
        : 0

      // Pour l'instant, pas de vrai système d'avis donc on met une note par défaut
      const noteMoyenne = 4.5
      const totalAvis = 0

      return {
        id: pro.id.toString(), // Convertir BigInt en string
        prenom: pro.prenom,
        nom: pro.nom,
        username: pro.username,
        bio: pro.bio || 'Professionnel passionné par son métier',
        photo: pro.photo,
        specialite: pro.specialite || pro.eventTypes[0]?.titre || 'Professionnel',
        categorie: pro.categorie || null,
        email: pro.email,
        telephone: pro.telephone || null,
        ville: pro.ville || 'Non spécifié',
        tarifMoyen: tarifMoyen > 0 ? Math.round(tarifMoyen) : null,
        noteMoyenne,
        totalAvis,
        verification: true, // Par défaut, tous les pros sont vérifiés
        experience: null, // À ajouter dans le schéma si besoin
        eventTypes: pro.eventTypes.map((et: any) => ({
          ...et,
          id: et.id.toString() // Convertir aussi les IDs d'eventTypes
        })),
        nextDispo: null, // À calculer avec les vraies disponibilités
        stats: {
          totalRDV: pro._count.bookings,
          tauxConfirmation: 90 // Par défaut
        }
      }
    })

    // Appliquer les filtres de prix et note après transformation
    let filteredPros = transformedPros
    if (minPrice) {
      filteredPros = filteredPros.filter((pro: any) => pro.tarifMoyen && pro.tarifMoyen >= parseInt(minPrice))
    }
    if (maxPrice) {
      filteredPros = filteredPros.filter((pro: any) => pro.tarifMoyen && pro.tarifMoyen <= parseInt(maxPrice))
    }
    if (rating) {
      filteredPros = filteredPros.filter((pro: any) => pro.noteMoyenne >= parseFloat(rating))
    }

    // Compter le total pour la pagination
    const total = filteredPros.length
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      professionals: filteredPros,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        categories: [
          { id: 'sante', label: 'Santé & Bien-être', count: 45 },
          { id: 'beaute', label: 'Beauté & Esthétique', count: 32 },
          { id: 'coaching', label: 'Coaching & Développement', count: 28 },
          { id: 'consulting', label: 'Consulting & Conseil', count: 21 }
        ],
        cities: [
          { name: 'Paris', count: 67 },
          { name: 'Lyon', count: 34 },
          { name: 'Marseille', count: 28 },
          { name: 'Bordeaux', count: 19 }
        ],
        priceRanges: [
          { min: 0, max: 50, count: 23 },
          { min: 50, max: 100, count: 45 },
          { min: 100, max: 200, count: 38 },
          { min: 200, max: 500, count: 15 }
        ]
      }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}
