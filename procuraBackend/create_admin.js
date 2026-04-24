const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  try {
    await prisma.user.create({
      data: {
        username: 'admin',
        password: password,
        name: 'Administrador',
        role: 'ADMIN'
      }
    });
    console.log('Admin created');
  } catch (e) {
    console.log('User exists or error:', e.message);
  }
}

main().then(() => process.exit(0));