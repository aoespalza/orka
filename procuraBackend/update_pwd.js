const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: password }
  });
  console.log('Password updated');
}

main().then(() => process.exit(0));