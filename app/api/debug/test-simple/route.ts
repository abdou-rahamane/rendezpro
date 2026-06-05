import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== TEST SIMPLE SQL ===")
    
    // Test SQL très simple sans les nouveaux champs
    const simpleQuery = `
      SELECT DISTINCT
        u.id, u.prenom, u.nom, u.username, u.bio, u.photo,
        u.email, u."createdAt",
        COUNT(DISTINCT b.id) as total_bookings
      FROM "User" u
      INNER JOIN "EventType" et ON u.id = et."userId" AND et.actif = true
      LEFT JOIN "Booking" b ON u.id = b."userId" AND b.statut = 'confirmed'
      GROUP BY u.id, u.prenom, u.nom, u.username, u.bio, u.photo, u.email, u."createdAt"
      ORDER BY u."createdAt" DESC
      LIMIT 5
    `
    
    const result = await prisma.$queryRawUnsafe(simpleQuery)
    
    console.log("Simple SQL OK:", (result as any[]).length, "pros")
    
    // Test SQL avec un seul champ de localisation
    const locationQuery = `
      SELECT DISTINCT
        u.id, u.prenom, u.nom, u.username, u.bio, u.photo,
        u.email, u."createdAt", u.ville,
        COUNT(DISTINCT b.id) as total_bookings
      FROM "User" u
      INNER JOIN "EventType" et ON u.id = et."userId" AND et.actif = true
      LEFT JOIN "Booking" b ON u.id = b."userId" AND b.statut = 'confirmed'
      GROUP BY u.id, u.prenom, u.nom, u.username, u.bio, u.photo, u.email, u."createdAt", u.ville
      ORDER BY u."createdAt" DESC
      LIMIT 5
    `
    
    const locationResult = await prisma.$queryRawUnsafe(locationQuery)
    
    console.log("Location SQL OK:", (locationResult as any[]).length, "pros")
    
    return NextResponse.json({
      simple: {
        count: (result as any[]).length,
        data: result
      },
      location: {
        count: (locationResult as any[]).length,
        data: locationResult
      }
    })
    
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
