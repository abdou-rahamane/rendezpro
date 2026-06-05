import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== CHECK DATABASE COLUMNS ===")
    
    // Vérifier les colonnes de la table User
    const rawQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    const columns = await prisma.$queryRawUnsafe(rawQuery)
    
    console.log("User table columns:")
    ;(columns as any[]).forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
    // Vérifier si les nouvelles colonnes existent
    const hasSpecialite = (columns as any[]).some(col => col.column_name === 'specialite')
    const hasVille = (columns as any[]).some(col => col.column_name === 'ville')
    const hasCodePostal = (columns as any[]).some(col => col.column_name === 'codePostal')
    const hasPays = (columns as any[]).some(col => col.column_name === 'pays')
    
    return NextResponse.json({
      columns,
      hasLocationFields: {
        specialite: hasSpecialite,
        ville: hasVille,
        codePostal: hasCodePostal,
        pays: hasPays
      }
    })
    
  } catch (error) {
    console.error("Check columns error:", error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
