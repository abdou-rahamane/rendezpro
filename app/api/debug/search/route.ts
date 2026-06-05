import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test avec SQL brut pour voir ce qui se passe
    const rawQuery = `
      SELECT 
        u.id, u.prenom, u.nom, u.username,
        et.id as event_id, et.titre, et.actif
      FROM "User" u
      LEFT JOIN "EventType" et ON u.id = et."userId"
      WHERE u.id = 'cmoss1woj0007bphrjfgdqxnl'
      ORDER BY et.id
    `
    
    const result = await prisma.$queryRawUnsafe(rawQuery)
    
    return NextResponse.json({
      rawResult: result,
      zakariaId: 'cmoss1woj0007bphrjfgdqxnl'
    })
      }))
    })
  } catch (error) {
    console.error('Debug search error:', error)
    return NextResponse.json(
      { error: "Erreur debug search" },
      { status: 500 }
    )
  }
}
