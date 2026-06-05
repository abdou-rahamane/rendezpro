const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEventTypes() {
  console.log('🔧 Mise à jour des EventType existants...');
  
  const eventTypes = await prisma.$queryRaw`SELECT id FROM "EventType"`;
  
  for (const et of eventTypes) {
    await prisma.$executeRaw`
      UPDATE "EventType" 
      SET "typeRDV" = COALESCE("typeRDV", 'individuel'),
          "maxParticipants" = CASE WHEN "typeRDV" = 'collectif' AND "maxParticipants" IS NULL THEN 2 ELSE "maxParticipants" END,
          "heureFixe" = CASE WHEN "typeRDV" = 'collectif' AND "heureFixe" IS NULL THEN '16:00' ELSE "heureFixe" END
      WHERE id = ${et.id}
    `;
    console.log(`✅ EventType ${et.id} mis à jour`);
  }
  
  console.log('🎉 Terminé !');
}

fixEventTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
