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

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function main() {
  assertSafeTestTarget();

  // Load Prisma/controller only after the database safety checks have passed.
  const prisma = require('../src/config/db');
  const { getProfileNudges } = require('../src/controllers/homeDiscoveryController');

  const suffix = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const email = `stage4-nudge-test-${suffix}@example.com`;
  const username = `s4nudge${suffix.replace(/-/g, '')}`;
  const password = `Stage4!${crypto.randomBytes(12).toString('hex')}aA9`;
  let testUser;

  try {
    testUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        firstName: 'Stage4',
        lastName: 'NudgeTest',
        fullName: 'Stage 4 Profile Nudge Test',
        role: 'STUDENT_FREELANCER',
        isMinor: false,
        age: 20,
        profile: {
          create: {
            tagline: 'Student Creator • Ready to Work',
            bio: 'Student Fresher ready to deliver quality work and build a verified portfolio.',
            avatarUrl: null,
            college: 'College / University',
            category: 'Graphic Design',
            githubUrl: null,
            youtubeUrl: null,
            drivePortfolio: null,
            skills: ['Student Talent', 'Fast Learner'],
            sampleFiles: [],
            portfolioItems: [],
            socialLinks: {},
            onboardingCompleted: false,
            onboardingStatus: 'PENDING',
            onboardingData: {}
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
        email: true,
        role: true
      }
    });

    const response = createResponse();
    await getProfileNudges(
      { user: { id: testUser.id, role: testUser.role } },
      response
    );

    if (response.statusCode !== 200 || !Array.isArray(response.body)) {
      throw new Error(
        `Profile-nudges controller returned HTTP-style status ${response.statusCode}: ${JSON.stringify(response.body)}`
      );
    }

    const actualTypes = new Set(response.body.map((nudge) => nudge.type));
    const expectedTypes = ['PORTFOLIO', 'SKILLS', 'PROFILE_BASICS', 'VERIFICATION'];
    const missingTypes = expectedTypes.filter((type) => !actualTypes.has(type));

    if (missingTypes.length > 0) {
      throw new Error(
        `The database-backed profile-nudges check missed expected types: ${missingTypes.join(', ')}. Received: ${[...actualTypes].join(', ')}`
      );
    }

    console.log('\nPASS: database-backed profile-nudges check returned all four expected suggestions.');
    console.log('Nudge types:', response.body.map((nudge) => nudge.type).join(', '));
    console.log('\nUse this dedicated test account to inspect the actual Android Home UI:');
    console.log(`Email:    ${testUser.email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID:  ${testUser.id}`);
    console.log('\nThe account and incomplete profile are intentionally left in the database for device testing.');
    console.log('Delete this test account after verification; do not reuse it for real work.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Stage 4 profile-nudges database test did not complete.');
  console.error(error.message || error);
  process.exitCode = 1;
});
