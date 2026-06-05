import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Récupérer le professionnel avec ses données
    const professional = await prisma.user.findUnique({
      where: { username },
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
