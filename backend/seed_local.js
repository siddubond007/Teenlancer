const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');

async function main() {
  console.log("🌱 Seeding Local PostgreSQL Database...");

  const adminPassHash = await bcrypt.hash('VenkiSiddu@007always', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'siddusiddharth80193@gmail.com' },
    update: { passwordHash: adminPassHash, role: 'ADMIN', isSuspended: false },
    create: {
      username: 'siddharth_admin',
      email: 'siddusiddharth80193@gmail.com',
      passwordHash: adminPassHash,
      firstName: 'Siddharth',
      lastName: 'Nanda',
      fullName: 'Siddharth Kumar Nanda',
      role: 'ADMIN',
      age: 21,
      profile: {
        create: {
          tagline: 'Platform Administrator & Founder',
          bio: 'Master Administrator for SkillLaunch Marketplace.',
          college: 'Mohan Babu University (MBU) - Tirupati',
          category: 'Platform Operations',
          hourlyRate: 999
        }
      },
      wallet: { create: { availableBalance: 5000 } }
    }
  });

  const studentPass = await bcrypt.hash('Password@123', 10);
  await prisma.user.upsert({
    where: { email: 'student@gmail.com' },
    update: { passwordHash: studentPass },
    create: {
      username: 'student_pro',
      email: 'student@gmail.com',
      passwordHash: studentPass,
      firstName: 'Aarav',
      lastName: 'Sharma',
      fullName: 'Aarav Sharma',
      role: 'STUDENT_FREELANCER',
      age: 19,
      points: 90,
      profile: {
        create: {
          tagline: 'Full Stack React & Node.js Developer',
          bio: 'Computer Science undergraduate at IIT Madras building scalable web applications.',
          college: 'IIT Madras - Indian Institute of Technology',
          category: 'Web Development',
          hourlyRate: 699,
          skills: ['React.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Next.js']
        }
      },
      wallet: { create: { availableBalance: 1200 } }
    }
  });

  await prisma.user.upsert({
    where: { email: 'client@gmail.com' },
    update: { passwordHash: studentPass },
    create: {
      username: 'startup_client',
      email: 'client@gmail.com',
      passwordHash: studentPass,
      firstName: 'Rahul',
      lastName: 'Verma',
      fullName: 'Rahul Verma',
      role: 'CLIENT',
      age: 28,
      profile: {
        create: {
          tagline: 'Founder @ TechLabs',
          bio: 'Hiring talented students to build MVPs.'
        }
      },
      wallet: { create: { availableBalance: 15000 } }
    }
  });

  console.log("✅ Local Database Ready!");
}

main().finally(async () => { await prisma.$disconnect(); });
