import Ollama from "ollama"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { message } = await req.json()
  const today = new Date()

  const [bookings, availabilities, eventTypes, user] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { eventType: true },
      orderBy: { date: "asc" },
    }),
    prisma.availability.findMany({
      where: { userId: session.user.id, actif: true },
    }),
    prisma.eventType.findMany({
      where: { userId: session.user.id, actif: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  const userName = user?.prenom || session.user.name?.split(" ")[0] || "Professionnel"

  const dayNames: Record<string, string> = {
    "1": "Lundi", "2": "Mardi", "3": "Mercredi",
    "4": "Jeudi", "5": "Vendredi", "6": "Samedi", "0": "Dimanche",
  }

  const systemPrompt = `Tu es un assistant intelligent intégré dans RendezPro, une plateforme de prise de rendez-vous en ligne.
Tu t'adresses à ${userName}.
Aujourd'hui : ${today.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Rendez-vous (${bookings.length} au total) :
${bookings.length > 0
  ? bookings.map(b =>
      `- ${b.clientNom} (${b.eventType?.titre || "?"}) le ${new Date(b.date).toLocaleDateString("fr-FR")} à ${new Date(b.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — Statut: ${b.statut}`
    ).join("\n")
  : "Aucun rendez-vous pour le moment"
}

Disponibilités hebdomadaires :
${availabilities.length > 0
  ? availabilities.map(a => `- ${dayNames[a.jour] || a.jour} : ${a.heureDebut} → ${a.heureFin}`).join("\n")
  : "Aucune disponibilité configurée"
}

Types de rendez-vous proposés :
${eventTypes.length > 0
  ? eventTypes.map(e => `- ${e.titre} (${e.duree} min, ${e.prix > 0 ? e.prix + "€" : "Gratuit"})`).join("\n")
  : "Aucun type de rendez-vous créé"
}

Instructions :
- Réponds toujours en français
- Utilise le prénom ${userName}
- Sois concis, professionnel et bienveillant
- Utilise des emojis pour rendre les réponses lisibles
- Calcule les créneaux disponibles depuis les disponibilités et RDV existants
- Détecte les conflits si deux RDV ont la même date/heure
- Si aucune donnée disponible, guide l'utilisateur pour configurer son compte`

  try {
    const response = await Ollama.chat({
      model: "llama3.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: false,
    })

    return NextResponse.json({ response: response.message.content })
  } catch (error) {
    console.error("Ollama error:", error)
    return NextResponse.json(
      { error: "Erreur Ollama. Assurez-vous que Ollama est lancé et que le modèle llama3.2 est installé." },
      { status: 500 }
    )
  }
}
