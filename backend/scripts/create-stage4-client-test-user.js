require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to create a test account when NODE_ENV=production.');
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
  const email = `stage4-client-test-${suffix}@example.com`;
  const username = `s4client${suffix.replace(/-/g, '')}`;
  const password = `Stage4Client!${crypto.randomBytes(12).toString('hex')}aA9`;

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        firstName: 'Stage4',
        lastName: 'ClientTest',
        fullName: 'Stage 4 Client Discovery Test',
        role: 'CLIENT',
        isMinor: false,
        age: 25,
        profile: {
          create: {
            tagline: 'Testing Design and Development Services',
            bio: 'Dedicated test client profile for validating personalized service discovery in the SkillLaunch development environment.',
            college: '',
            category: 'Design',
            hourlyRate: null,
            skills: [],
            badges: [],
            onboardingCompleted: true,
            onboardingStatus: 'COMPLETED',
            onboardingData: {
              hiringCategories: ['Design', 'Development'],
              clientType: 'SMALL_BUSINESS'
            }
          }
        },
        wallet: {
          create: {
            isParentAccount: false,
            availableBalance: 0
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    console.log('\nPASS: development client test account created.');
    console.log('Hiring categories: Design, Development');
    console.log('\nAndroid test login credentials:');
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID:  ${user.id}`);
    console.log('\nThe account is left in the database for manual app testing.');
    console.log('Delete this dedicated test account after verification; do not use it for real work.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Could not create the Stage 4 client test account.');
  console.error(error.message || error);
  process.exitCode = 1;
});
