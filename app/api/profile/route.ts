import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, nom, prenom, email, username, bio, photo, specialite, categorie, telephone, ville, "codePostal", pays
      FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    const user = rows[0] ?? null

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { 
      nom, 
      prenom, 
      bio, 
      photo, 
      username, 
      specialite, 
      categorie,
      telephone,
      ville, 
      codePostal, 
      pays 
    } = await request.json()

    if (!nom || !prenom || !username) {
      return NextResponse.json(
        { error: "Nom, prénom et username sont obligatoires" },
        { status: 400 }
      )
    }

    const usernameRegex = /^[a-z0-9-]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Le username ne peut contenir que des lettres minuscules, chiffres et tirets" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: session.user.id } },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ce username est déjà pris" },
        { status: 409 }
      )
    }

    await prisma.$executeRaw`
      UPDATE "User" SET
        nom = ${nom},
        prenom = ${prenom},
        bio = ${bio || null},
        photo = ${photo || null},
        username = ${username},
        specialite = ${specialite || null},
        categorie = ${categorie || null},
        telephone = ${telephone || null},
        ville = ${ville || null},
        "codePostal" = ${codePostal || null},
        pays = ${pays || 'France'},
        "updatedAt" = NOW()
      WHERE id = ${session.user.id}
    `

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, nom, prenom, email, username, bio, photo, specialite, categorie, telephone, ville, "codePostal", pays
      FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    return NextResponse.json({ message: "Profil mis à jour", user: rows[0] })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}
