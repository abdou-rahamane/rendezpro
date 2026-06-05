import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id: params.id },
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Type de RDV introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ eventType })
  } catch (error) {
    console.error('Erreur API event-type:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
