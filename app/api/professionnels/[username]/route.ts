import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Récupérer le professionnel avec ses données
    const professional = await prisma.$queryRawUnsafe(`
      SELECT 
        u.id, u.username, u.nom, u.prenom, u.bio, u.photo, u.specialite, 
        u.ville, u.email, u.telephone, u.website, u.experience,
        (SELECT AVG(r.note) FROM "Review" r WHERE r."userId" = u.id) as "noteMoyenne",
        (SELECT COUNT(*) FROM "Review" r WHERE r."userId" = u.id) as "totalAvis"
      FROM "User" u 
      WHERE u.username = $1
    `, username) as any[]

    if (!professional || professional.length === 0) {
      return NextResponse.json({ error: "Professionnel non trouvé" }, { status: 404 })
    }

    const prof = professional[0]

    // Récupérer les event types avec slots et bookings
    const eventTypes = await prisma.$queryRawUnsafe(`
      SELECT 
        et.id, et.titre, et.description, et.duree, et.prix, et.lieu,
        et."typeRDV", et."maxParticipants", et."heureFixe"
      FROM "EventType" et 
      WHERE et."userId" = $1 AND et.actif = true
    `, prof.id) as any[]

    // Pour chaque event type, récupérer slots et bookings
    for (const et of eventTypes) {
      const slots = await prisma.$queryRawUnsafe(`
        SELECT id, "dateDebut", "dateFin" 
        FROM "EventTypeSlot" 
        WHERE "eventTypeId" = $1 AND "dateDebut" >= NOW()
        ORDER BY "dateDebut" ASC
      `, et.id) as any[]

      const bookings = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM "Booking" 
        WHERE "eventTypeId" = $1 AND statut != 'cancelled'
      `, et.id) as any[]

      et.slots = slots
      et.bookingsCount = bookings[0]?.count || 0
    }
        availabilities: {
          where: { actif: true },
          select: {
            id: true,
            jour: true,
            heureDebut: true,
            heureFin: true
          }
        },
        bookings: {
          select: {
            id: true,
            statut: true,
            date: true,
            clientNom: true,
            clientEmail: true
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
      }
    })

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien un professionnel (avec des types de RDV)
    if (professional.eventTypes.length === 0) {
      return NextResponse.json(
        { error: "Ce professionnel n'a pas de types de rendez-vous configurés" },
        { status: 404 }
      )
    }

    // Transformer les données
    const transformedPro = {
      id: professional.id,
      prenom: professional.prenom,
      nom: professional.nom,
      username: professional.username,
      bio: professional.bio || 'Professionnel passionné par son métier',
      photo: professional.photo,
      specialite: (professional as any).specialite || professional.eventTypes[0]?.titre || 'Professionnel',
      ville: (professional as any).ville || 'Non spécifié',
      tarifMoyen: professional.eventTypes.length > 0
        ? Math.round(
            professional.eventTypes.reduce((sum, type) => sum + type.prix, 0) / 
            professional.eventTypes.length
          )
        : null,
      noteMoyenne: 4.5, // Par défaut, pas de système d'avis encore
      totalAvis: 0,
      verification: true,
      email: professional.email,
      phone: null, // À ajouter dans le schéma
      website: null, // À ajouter dans le schéma
      experience: null, // À ajouter dans le schéma
      eventTypes: professional.eventTypes,
      availabilities: professional.availabilities,
      reviews: [], // Pas de système d'avis encore
      stats: {
        totalRDV: professional._count.bookings,
        tauxConfirmation: 90
      }
    }

    return NextResponse.json(transformedPro)

  } catch (error) {
    console.error('Professional API error:', error)
    return NextResponse.json(
      { error: "Erreur lors du chargement du professionnel" },
      { status: 500 }
    )
  }
}
