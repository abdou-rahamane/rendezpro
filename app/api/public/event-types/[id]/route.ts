import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Use raw SQL to get the new fields that Prisma client doesn't have yet
    const rows = await prisma.$queryRawUnsafe(
      `SELECT et.id, et.titre, et.description, et.duree, et.prix, et.lieu,
              et."typeRDV", et."maxParticipants", et."heureFixe", et."userId",
              u.nom, u.prenom, u.email, u.bio
       FROM "EventType" et
       INNER JOIN "User" u ON et."userId" = u.id
       WHERE et.id = $1 AND et.actif = true
       LIMIT 1`,
      params.id
    ) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Type de RDV introuvable' },
        { status: 404 }
      )
    }

    const row = rows[0]
    const eventType = {
      id: row.id,
      titre: row.titre,
      description: row.description,
      duree: Number(row.duree),
      prix: Number(row.prix),
      lieu: row.lieu,
      typeRDV: row.typeRDV || "individuel",
      maxParticipants: row.maxParticipants != null ? Number(row.maxParticipants) : null,
      heureFixe: row.heureFixe,
      userId: row.userId,
      user: { nom: row.nom, prenom: row.prenom, email: row.email, bio: row.bio },
    }

    // Get slots and bookings
    const slots = await prisma.$queryRawUnsafe(
      `SELECT id, "dateDebut", "dateFin" 
       FROM "EventTypeSlot" 
       WHERE "eventTypeId" = $1 
         AND "dateDebut" >= NOW()
       ORDER BY "dateDebut" ASC`,
      params.id
    ) as any[]

    const bookings = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count
       FROM "Booking" 
       WHERE "eventTypeId" = $1 
         AND statut != 'cancelled'`,
      params.id
    ) as any[]

    // Vérifier si RDV collectif est complet
    const isComplet = eventType.typeRDV === 'collectif' &&
      eventType.maxParticipants !== null &&
      bookings[0]?.count >= eventType.maxParticipants

    if (isComplet) {
      return NextResponse.json(
        { error: 'Ce rendez-vous est complet' },
        { status: 410 }
      )
    }
    
    console.log('API FINAL eventType:', JSON.stringify(eventType))
    console.log('API FINAL typeRDV:', eventType.typeRDV)
    console.log('API FINAL heureFixe:', eventType.heureFixe)
    return NextResponse.json({ 
      eventType: {
        ...eventType,
        slotsDisponibles: slots,
        placesRestantes: eventType.typeRDV === 'collectif' && eventType.maxParticipants
          ? eventType.maxParticipants - (bookings[0]?.count || 0)
          : null
      }
    })
  } catch (error) {
    console.error('Erreur API event-type:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
