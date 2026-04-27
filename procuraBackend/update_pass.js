const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newHash = bcrypt.hashSync('admin123', 10);
  console.log('New hash:', newHash);
  
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: newHash }
  });
  
  console.log('Password updated!');
  prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });