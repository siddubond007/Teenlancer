require('dotenv').config();

const FIXTURE_USER_ID = '1fb2bcb8-066c-45bd-b034-50f041e73777';
const FIXTURE_EMAIL = 'stage4-development-seller-1791552846047-440b60@example.com';
const FIXTURE_GIG_TITLE = 'Stage 4 Development Category Test Service';
const FIXTURE_GIG_DESCRIPTION =
  'A test-only published Development service created to verify saved client category matching. Do not use for real purchases.';

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to delete test fixture data when NODE_ENV=production.');
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

function assertNoMarketplaceActivity(user) {
  const allowedGigCount = 1;
  const counts = user._count || {};

  if (counts.gigs !== allowedGigCount) {
    throw new Error(
      `Safety stop: expected exactly one gig for this test seller, found ${counts.gigs}. No data was deleted.`
    );
  }

  const otherRelations = Object.entries(counts).filter(
    ([relation, count]) => relation !== 'gigs' && count !== 0
  );

  if (otherRelations.length > 0) {
    throw new Error(
      'Safety stop: this test user has associated activity (' +
      otherRelations.map(([relation, count]) => `${relation}=${count}`).join(', ') +
      '). No data was deleted.'
    );
  }

  const gig = user.gigs?.[0];
  if (
    !gig ||
    gig.title !== FIXTURE_GIG_TITLE ||
    gig.category !== 'Development' ||
    gig.description !== FIXTURE_GIG_DESCRIPTION ||
    gig.status !== 'PUBLISHED' ||
    gig.isDeleted !== false
  ) {
    throw new Error(
      'Safety stop: the seller gig does not match the exact test fixture identity. No data was deleted.'
    );
  }

  if (gig.orders.length !== 0) {
    throw new Error(
      'Safety stop: the test gig has order records. No data was deleted.'
    );
  }
}

async function main() {
  assertSafeTestTarget();

  const prisma = require('../src/config/db');

  try {
    const user = await prisma.user.findUnique({
      where: { id: FIXTURE_USER_ID },
      include: {
        gigs: { include: { orders: { select: { id: true } } } },
        _count: {
          select: {
            gigs: true,
            customOffersAsBuyer: true,
            customOffersAsSeller: true,
            jobsPosted: true,
            bidsPlaced: true,
            ordersAsClient: true,
            ordersAsSeller: true,
            reviewsWritten: true,
            reviewsReceived: true,
            messagesSent: true,
            payoutRequests: true,
            moderationLogs: true,
            notifications: true,
            disputesOpened: true,
            investigationActions: true,
            strikeLogs: true,
            activityEvents: true,
            gigAnalyticsEvents: true,
            gigFavorites: true,
            gigRevisions: true
          }
        }
      }
    });

    if (!user) {
      console.log('No matching Stage 4 Development test seller found. Nothing to delete.');
      return;
    }

    if (
      user.email !== FIXTURE_EMAIL ||
      user.role !== 'STUDENT_FREELANCER' ||
      !String(user.username || '').startsWith('s4devseller')
    ) {
      throw new Error(
        'Safety stop: test seller ID exists but email, role, or username does not match the fixture identity. No data was deleted.'
      );
    }

    assertNoMarketplaceActivity(user);

    const gig = user.gigs[0];
    await prisma.$transaction(async (tx) => {
      await tx.gig.delete({ where: { id: gig.id } });
      await tx.user.delete({ where: { id: user.id } });
    });

    console.log('\nPASS: removed the exact Stage 4 Development test fixture.');
    console.log(`Deleted test gig ID: ${gig.id}`);
    console.log(`Deleted test seller ID: ${user.id}`);
    console.log('The transaction deleted only this fixture gig and seller plus their dependent profile, wallet, and verification record.');
    console.log('No other accounts, gigs, jobs, or marketplace records were intentionally targeted.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Stage 4 test fixture cleanup did not complete.');
  console.error(error.message || error);
  process.exitCode = 1;
});
