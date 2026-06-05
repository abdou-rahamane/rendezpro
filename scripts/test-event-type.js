const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEventType() {
  console.log('Test EventType avec les nouveaux champs...');
  
  // Test avec raw SQL
  const rows = await prisma.$queryRaw`
    SELECT id, titre, "typeRDV", "heureFixe", "maxParticipants"
    FROM "EventType" 
    WHERE id = 'cuid_1740180757608_6j2h6d8jx'
    LIMIT 1
  `;
  
  console.log('Résultat raw SQL:', rows);
  
  await prisma.$disconnect();
}

testEventType().catch(console.error);
