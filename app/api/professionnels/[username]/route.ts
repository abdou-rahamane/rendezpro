import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        u.id, u.username, u.nom, u.prenom, u.bio, u.photo, u.specialite, 
        u.ville, u.email, u.telephone
      FROM "User" u 
      WHERE u.username = $1
    `, username) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Professionnel non trouvé" }, { status: 404 })
    }

    const prof = rows[0]

    const eventTypes = await prisma.$queryRawUnsafe(`
      SELECT 
        et.id, et.titre, et.description, et.duree, et.prix, et.lieu,
        et."typeRDV", et."maxParticipants", et."heureFixe"
      FROM "EventType" et 
      WHERE et."userId" = $1 AND et.actif = true
      ORDER BY et."createdAt" ASC
    `, prof.id) as any[]

    for (const et of eventTypes) {
      et.duree = Number(et.duree)
      et.prix = Number(et.prix)
      et.maxParticipants = et.maxParticipants != null ? Number(et.maxParticipants) : null

      const slots = await prisma.$queryRawUnsafe(`
        SELECT id, "dateDebut", "dateFin" 
        FROM "EventTypeSlot" 
        WHERE "eventTypeId" = $1 AND "dateDebut" >= NOW()
        ORDER BY "dateDebut" ASC
      `, et.id) as any[]

      et.slots = slots
    }

    const totalBookings = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "Booking" b
      INNER JOIN "EventType" et ON et.id = b."eventTypeId"
      WHERE et."userId" = $1 AND b.statut != 'cancelled'
    `, prof.id) as any[]

    return NextResponse.json({
      id: prof.id,
      prenom: prof.prenom,
      nom: prof.nom,
      username: prof.username,
      bio: prof.bio || '',
      photo: prof.photo,
      specialite: prof.specialite || (eventTypes[0]?.titre ?? 'Professionnel'),
      ville: prof.ville || 'Non spécifié',
      email: prof.email,
      telephone: prof.telephone,
      noteMoyenne: 0,
      totalAvis: 0,
      verification: true,
      eventTypes,
      totalBookings: Number(totalBookings[0]?.count) || 0,
    })

  } catch (error) {
    console.error('Professional API error:', error)
    return NextResponse.json(
      { error: "Erreur lors du chargement du professionnel" },
      { status: 500 }
    )
  }
}
