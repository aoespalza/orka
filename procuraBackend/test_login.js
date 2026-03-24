const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { username: 'admin' } });
  console.log('User found:', user ? 'YES' : 'NO');
  if (user) {
    const isValid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', isValid);
    console.log('isActive:', user.isActive);
  }
}
test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
