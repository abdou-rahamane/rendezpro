import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json()

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate username from prenom-nom (e.g. abdourahamane-ba)
    const normalize = (s: string) =>
      s.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "") // remove accents
       .replace(/[^a-z0-9]/g, "")       // keep only alphanumeric

    const baseUsername = `${normalize(firstName)}-${normalize(lastName)}`

    // Ensure uniqueness by appending a number if needed
    let username = baseUsername
    let counter = 2
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter++}`
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        nom: lastName,
        prenom: firstName,
        email,
        password: hashedPassword,
        username,
      }
    })

    return NextResponse.json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.prenom} ${user.nom}`,
        username: user.username,
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    )
  }
}
