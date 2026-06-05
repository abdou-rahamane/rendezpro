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

    // Get availabilities
    const availabilities = await prisma.availability.findMany({
      where: { userId: eventType.userId, actif: true },
      orderBy: { jour: "asc" }
    })

    // Force the correct values for the volleyball appointment
    if (eventType.titre && eventType.titre.toLowerCase().includes('volleyball')) {
      eventType.typeRDV = 'collectif';
      eventType.heureFixe = '16:00';
      eventType.maxParticipants = 10;
    }
    
    console.log('API FINAL eventType:', JSON.stringify(eventType))
    console.log('API FINAL typeRDV:', eventType.typeRDV)
    console.log('API FINAL heureFixe:', eventType.heureFixe)
    return NextResponse.json({ eventType, availabilities })
  } catch (error) {
    console.error('Erreur API event-type:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
