import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== DÉBUT ANALYSE ROOT CAUSE ===")
    
    // 1. Vérifier si Zakaria existe dans la base
    const zakariaExists = await prisma.user.findUnique({
      where: { id: 'cmoss1woj0007bphrjfgdqxnl' },
      select: { id: true, prenom: true, nom: true }
    })
    console.log("1. Zakaria existe:", !!zakariaExists)
    
    // 2. Vérifier ses eventTypes directement
    const zakariaEvents = await prisma.eventType.findMany({
      where: { userId: 'cmoss1woj0007bphrjfgdqxnl' },
      select: { id: true, titre: true, actif: true }
    })
    console.log("2. EventTypes de Zakaria:", zakariaEvents.length, zakariaEvents)
    
    // 3. Test de la relation User -> EventTypes
    const zakariaWithEvents = await prisma.user.findUnique({
      where: { id: 'cmoss1woj0007bphrjfgdqxnl' },
      include: {
        eventTypes: {
          select: { id: true, titre: true, actif: true }
        }
      }
    })
    console.log("3. Zakaria avec include:", zakariaWithEvents?.eventTypes.length)
    
    // 4. Test de la clause WHERE exacte
    const whereClause = {
      eventTypes: {
        some: {
          actif: true
        }
      }
    }
    
    const testQuery = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        prenom: true,
        nom: true,
        eventTypes: {
          select: { id: true, titre: true, actif: true }
        }
      }
    })
    
    console.log("4. Résultat de la clause WHERE:")
    testQuery.forEach(u => {
      console.log(`  - ${u.prenom} ${u.nom}: ${u.eventTypes.length} eventTypes`)
    })
    
    // 5. Vérifier si Zakaria est dans les résultats
    const zakariaInResults = testQuery.find(u => u.id === 'cmoss1woj0007bphrjfgdqxnl')
    console.log("5. Zakaria dans résultats:", !!zakariaInResults)
    
    // 6. Test WITHOUT le filtre actif
    const testWithoutActif = await prisma.user.findMany({
      where: {
        eventTypes: {
          some: {}
        }
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        _count: {
          select: { eventTypes: true }
        }
      }
    })
    
    console.log("6. Sans filtre actif:")
    testWithoutActif.forEach(u => {
      console.log(`  - ${u.prenom} ${u.nom}: ${u._count.eventTypes} eventTypes`)
    })
    
    const zakariaInNoFilter = testWithoutActif.find(u => u.id === 'cmoss1woj0007bphrjfgdqxnl')
    console.log("6b. Zakaria sans filtre:", !!zakariaInNoFilter)
    
    return NextResponse.json({
      analysis: {
        zakariaExists: !!zakariaExists,
        zakariaEventsCount: zakariaEvents.length,
        zakariaEvents: zakariaEvents,
        withIncludeCount: zakariaWithEvents?.eventTypes.length || 0,
        whereClauseResults: testQuery.length,
        whereClauseResultsDetail: testQuery.map(u => ({
          id: u.id,
          name: `${u.prenom} ${u.nom}`,
          eventTypesCount: u.eventTypes.length
        })),
        zakariaInWhereResults: !!zakariaInResults,
        withoutFilterResults: testWithoutActif.length,
        withoutFilterDetail: testWithoutActif.map(u => ({
          id: u.id,
          name: `${u.prenom} ${u.nom}`,
          eventTypesCount: u._count.eventTypes
        })),
        zakariaInNoFilter: !!zakariaInNoFilter
      }
    })
    
  } catch (error) {
    console.error("Root cause analysis error:", error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
