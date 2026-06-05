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

    // Filtrer les RDV collectifs complets
    const eventTypesFiltres = eventTypes.filter(et => {
      if (et.typeRDV === 'collectif' && et.maxParticipants) {
        return et.bookingsCount < et.maxParticipants
      }
      return true
    })

    return NextResponse.json({
      ...prof,
      eventTypes: eventTypesFiltres,
      verification: true
    })

  } catch (error) {
    console.error("Erreur API professionnel:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
