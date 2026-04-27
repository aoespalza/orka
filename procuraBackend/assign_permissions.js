const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profileId = 'f7554746-6799-4b95-8e10-880c74262850';
  const permissions = await prisma.permission.findMany();
  
  for (const p of permissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId, permissionId: p.id } },
      update: {},
      create: { profileId, permissionId: p.id }
    });
    console.log('Assigned:', p.code);
  }
}

main().then(() => { console.log('Done!'); prisma.$disconnect(); }).catch(e => { console.error(e); prisma.$disconnect(); });