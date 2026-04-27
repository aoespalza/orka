const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'admin' } });
  console.log('User found:', user ? user.username : 'NO');
  
  if (user) {
    const valid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', valid);
  }
  
  prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });