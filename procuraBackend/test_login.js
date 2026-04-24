const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ log: ['query'] });

async function test() {
  console.log('=== Testing Prisma + bcrypt ===');
  
  const user = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  
  console.log('User from DB:', user ? user.username : 'NOT FOUND');
  console.log('Password in DB:', user ? user.password : 'N/A');
  console.log('Password length:', user ? user.password.length : 0);
  
  if (user) {
    const match = await bcrypt.compare('admin123', user.password);
    console.log('Bcrypt compare result:', match);
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);