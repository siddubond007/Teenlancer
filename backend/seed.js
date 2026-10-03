const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');

async function main() {
  console.log("🌱 Seeding Admin & Registered Users into PostgreSQL...");

  // 1. Create Super Administrator Account
  const adminPasswordHash = await bcrypt.hash('VenkiSiddu@007always', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'siddusiddharth80193@gmail.com' },
    update: { 
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      isSuspended: false
    },
    create: {
      username: 'siddharth_admin',
      email: 'siddusiddharth80193@gmail.com',
      passwordHash: adminPasswordHash,
      firstName: 'Siddharth',
      lastName: 'Nanda',
      fullName: 'Siddharth Kumar Nanda',
      role: 'ADMIN',
      age: 21,
      profile: {
        create: {
          tagline: 'Super Administrator & Platform Owner',
          bio: 'Master Platform Administrator for SkillLaunch.',
          college: 'Mohan Babu University (MBU) - Tirupati',
          category: 'Platform Operations',
          hourlyRate: 999
        }
      },
      wallet: { create: { availableBalance: 5000 } }
    }
  });

  // 2. Create Student: Aarav Sharma
  const defaultPass = await bcrypt.hash('Password@123', 10);
  await prisma.user.upsert({
    where: { email: 'aarav@iit.edu' },
    update: {},
    create: {
      username: 'aarav_codes',
      email: 'aarav@iit.edu',
      passwordHash: defaultPass,
      firstName: 'Aarav',
      lastName: 'Sharma',
      fullName: 'Aarav Sharma',
      role: 'STUDENT_FREELANCER',
      age: 19,
      points: 85,
      profile: {
        create: {
          tagline: 'Full Stack React & Node.js Developer',
          bio: 'CSE undergraduate at IIT Madras building modern web applications.',
          college: 'IIT Madras - Indian Institute of Technology',
          category: 'Web Development',
          hourlyRate: 699,
          skills: ['React.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Next.js']
        }
      },
      wallet: { create: { availableBalance: 1200 } }
    }
  });

  // 3. Create Student: Priya Patel
  await prisma.user.upsert({
    where: { email: 'priya@gmail.com' },
    update: {},
    create: {
      username: 'priya_edits',
      email: 'priya@gmail.com',
      passwordHash: defaultPass,
      firstName: 'Priya',
      lastName: 'Patel',
      fullName: 'Priya Patel',
      role: 'STUDENT_FREELANCER',
      age: 17,
      isMinor: true,
      points: 90,
      profile: {
        create: {
          tagline: 'Viral Reels & Shorts Video Editor',
          bio: 'Creating high-retention video content for creators and brands.',
          college: 'Higher Secondary School',
          category: 'Video Editing',
          hourlyRate: 450,
          skills: ['Premiere Pro', 'CapCut', 'After Effects', 'Subtitles']
        }
      },
      wallet: { create: { availableBalance: 850, isParentAccount: true } }
    }
  });

  // 4. Create Student: Rohan Verma
  await prisma.user.upsert({
    where: { email: 'rohan@nid.edu' },
    update: {},
    create: {
      username: 'rohan_design',
      email: 'rohan@nid.edu',
      passwordHash: defaultPass,
      firstName: 'Rohan',
      lastName: 'Verma',
      fullName: 'Rohan Verma',
      role: 'STUDENT_FREELANCER',
      age: 20,
      points: 60,
      profile: {
        create: {
          tagline: 'Brand Identity & Minimalist Logo Designer',
          bio: 'Design undergraduate at NID creating modern vector identities.',
          college: 'National Institute of Design (NID) - Ahmedabad',
          category: 'Graphic Design',
          hourlyRate: 599,
          skills: ['Figma', 'Adobe Illustrator', 'Logo Design', 'Photoshop']
        }
      },
      wallet: { create: { availableBalance: 2000 } }
    }
  });

  // 5. Create Client: Rahul Verma
  const client1 = await prisma.user.upsert({
    where: { email: 'rahul@startup.com' },
    update: {},
    create: {
      username: 'rahul_startup',
      email: 'rahul@startup.com',
      passwordHash: defaultPass,
      firstName: 'Rahul',
      lastName: 'Verma',
      fullName: 'Rahul Verma',
      role: 'CLIENT',
      age: 28,
      profile: {
        create: {
          tagline: 'Founder @ AlphaTech Labs',
          bio: 'Hiring talented students to build our startup MVPs.'
        }
      },
      wallet: { create: { availableBalance: 15000 } }
    }
  });

  // 6. Create Jobs
  await prisma.job.createMany({
    data: [
      {
        clientId: client1.id,
        title: 'React.js & Tailwind SaaS Dashboard Frontend',
        category: 'Web Development',
        description: 'Need a student developer to build a modern dark-mode responsive dashboard using React and Tailwind CSS.',
        budget: 2500,
        reviewWindow: 5,
        isOpen: true
      },
      {
        clientId: client1.id,
        title: 'Instagram Reels Video Editor for Tech Startup',
        category: 'Video Editing',
        description: 'Looking for a student editor to create 5 high-converting vertical reels with subtitles and sound effects.',
        budget: 1500,
        reviewWindow: 5,
        isOpen: true
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
