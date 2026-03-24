const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log('Hash:', hash);
  
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      password: hash,
      email: 'admin@orka.cl',
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    }
  });
  console.log('User created:', user.id);
}

createAdmin().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
