const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');

async function main() {
  const adminPassHash = await bcrypt.hash('VenkiSiddu@007always', 10);

  const updated = await prisma.user.updateMany({
    where: {
      email: { contains: 'siddusiddharth80193', mode: 'insensitive' }
    },
    data: {
      role: 'ADMIN',
      isSuspended: false,
      passwordHash: adminPassHash
    }
  });

  console.log(`👑 Updated ${updated.count} account(s) to ADMIN.`);
}

main().finally(async () => { await prisma.$disconnect(); });
