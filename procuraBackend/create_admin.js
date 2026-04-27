const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@orka.com' },
    update: {},
    create: {
      email: 'admin@orka.com',
      name: 'Administrador',
      password: hashedPassword,
      status: 'ACTIVE'
    }
  });
  console.log('Admin created/updated:', admin.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());