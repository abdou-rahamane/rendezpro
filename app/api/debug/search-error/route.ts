import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== DEBUG SEARCH ERROR ===")
    
    // Test simple SQL avec les nouveaux champs
    const rawQuery = `
      SELECT DISTINCT
        u.id, u.prenom, u.nom, u.username, u.bio, u.photo,
        u.email, u."createdAt", u.specialite, u.ville, u.codePostal, u.pays,
        COUNT(DISTINCT b.id) as total_bookings
      FROM "User" u
      INNER JOIN "EventType" et ON u.id = et."userId" AND et.actif = true
      LEFT JOIN "Booking" b ON u.id = b."userId" AND b.statut = 'confirmed'
      GROUP BY u.id, u.prenom, u.nom, u.username, u.bio, u.photo, u.email, u."createdAt", u.specialite, u.ville, u.codePostal, u.pays
      ORDER BY u."createdAt" DESC
      LIMIT 10 OFFSET 0
    `
    
    console.log("Executing query:", rawQuery)
    
    const result = await prisma.$queryRawUnsafe(rawQuery)
    
    console.log("Query successful! Found", (result as any[]).length, "professionals")
    
    return NextResponse.json({
      success: true,
      count: (result as any[]).length,
      professionals: result
    })
    
  } catch (error) {
    console.error("DEBUG ERROR:", error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
