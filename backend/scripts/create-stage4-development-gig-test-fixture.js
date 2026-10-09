require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to create test marketplace data when NODE_ENV=production.');
  }

  if (process.env.STAGE4_ALLOW_DB_TESTS !== 'true') {
    throw new Error(
      'Explicit opt-in required. Set STAGE4_ALLOW_DB_TESTS=true only after confirming this is a development/test database.'
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Check backend/.env before continuing.');
  }

  let databaseHost;
  try {
    databaseHost = new URL(process.env.DATABASE_URL).hostname.toLowerCase();
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL.');
  }

  const localHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    'host.docker.internal',
    'postgres',
    'db',
    'database'
  ]);

  if (
    !localHosts.has(databaseHost) &&
    process.env.STAGE4_ALLOW_REMOTE_DB_TESTS !== 'true'
  ) {
    throw new Error(
      `Database host "${databaseHost}" is not a recognized local host. Confirm this is a disposable development database, then set STAGE4_ALLOW_REMOTE_DB_TESTS=true to explicitly allow a remote test database. Never run this against production.`
    );
  }
}

async function main() {
  assertSafeTestTarget();

  const prisma = require('../src/config/db');
  const suffix = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const email = `stage4-development-seller-${suffix}@example.com`;
  const username = `s4devseller${suffix.replace(/-/g, '')}`;
  const password = `Stage4Dev!${crypto.randomBytes(12).toString('hex')}aA9`;

  try {
    const developmentCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'development' },
          { name: { equals: 'Development', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        firstName: 'Stage4',
        lastName: 'DevSeller',
        fullName: 'Stage 4 Development Test Seller',
        role: 'STUDENT_FREELANCER',
        isMinor: false,
        age: 21,
        averageRating: 4.9,
        totalReviews: 1,
        profile: {
          create: {
            tagline: 'Development test service seller',
            bio: 'A dedicated development-only test profile for validating verified Development gig discovery.',
            avatarUrl: null,
            college: 'Stage 4 Test College',
            category: 'Development',
            githubUrl: 'https://example.com/stage4-development-portfolio',
            skills: ['JavaScript', 'React', 'Node.js'],
            onboardingCompleted: true,
            onboardingStatus: 'COMPLETED',
            onboardingData: {
              primaryDomain: 'Development',
              selectedSkills: ['JavaScript', 'React', 'Node.js']
            }
          }
        },
        wallet: {
          create: {
            isParentAccount: false,
            availableBalance: 0
          }
        },
        verification: {
          create: {
            educationType: 'COLLEGE',
            collegeName: 'Stage 4 Test College',
            collegeEmail: `stage4-verified-fixture-${suffix}@example.com`,
            isCollegeEmailVerified: true,
            collegeIdStatus: 'APPROVED',
            govtIdStatus: 'APPROVED',
            status: 'APPROVED',
            reviewedAt: new Date()
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    const gig = await prisma.gig.create({
      data: {
        sellerId: user.id,
        title: 'Stage 4 Development Category Test Service',
        category: 'Development',
        categoryId: developmentCategory?.id ?? null,
        description: 'A test-only published Development service created to verify saved client category matching. Do not use for real purchases.',
        coverImage: 'https://placehold.co/900x600/101827/10b981?text=Development+Test+Gig',
        status: 'PUBLISHED',
        isDeleted: false,
        packages: {
          create: {
            tierName: 'Test Starter',
            price: 1200,
            deliveryDays: 5,
            revisions: 1,
            description: 'Test package used only to verify Development category discovery.'
          }
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        categoryId: true,
        status: true
      }
    });

    console.log('\nPASS: test-only Development gig and verified test seller created.');
    console.log('IMPORTANT: APPROVED verification is a development fixture only, not a real identity check.');
    console.log('\nTest seller login credentials:');
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID:  ${user.id}`);
    console.log('\nCreated gig:');
    console.log(`Gig ID:   ${gig.id}`);
    console.log(`Title:    ${gig.title}`);
    console.log(`Category: ${gig.category}`);
    console.log(`Category ID: ${gig.categoryId || '(no Development taxonomy row; legacy category is Development)'}`);
    console.log('\nNow sign in with your Stage 4 Client account and use Explore > Development > Refresh.');
    console.log('Delete this test seller and its gig after testing; do not use the fixture for real work.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Could not create the Development category test fixture.');
  console.error(error.message || error);
  process.exitCode = 1;
});
