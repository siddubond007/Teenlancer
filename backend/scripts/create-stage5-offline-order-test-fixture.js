/*
 * Stage 5: Home active-order offline-cache test fixture.
 *
 * Usage from backend/:
 *   npm run test:stage5-offline-order
 *   npm run cleanup:stage5-offline-order
 *
 * This creates two dedicated local/test users, one clearly marked sample gig,
 * one synthetic IN_PROGRESS order, and one fixture-only activity event.
 * No payment, transfer, payout, or real marketplace transaction is created.
 */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const STUDENT_EMAIL = 'stage5-offline-student@local.test';
const CLIENT_EMAIL = 'stage5-offline-client@local.test';
const STUDENT_USERNAME = '__stage5_offline_student';
const CLIENT_USERNAME = '__stage5_offline_client';
const FIXTURE_PROFILE_TAGLINE = 'Stage 5 offline-order fixture (test data only)';
const FIXTURE_GIG_TITLE = '[STAGE5 TEST] Active order for offline cache';
const FIXTURE_GIG_DESCRIPTION =
  'SYNTHETIC TEST DATA ONLY. This gig exists solely to verify the Android Home active-order Room cache. Do not purchase.';
const FIXTURE_ORDER_MARKER = '[STAGE5_OFFLINE_ORDER_FIXTURE] synthetic test data only';
const FIXTURE_EVENT_SOURCE = 'STAGE5_OFFLINE_ORDER_TEST_FIXTURE';
const TEST_PASSWORD = 'Stage5Offline!Test2026';

function assertSafeTestTarget() {
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('Refusing to seed or delete Stage 5 test data when NODE_ENV=production.');
  }

  if (process.env.STAGE5_ALLOW_DB_TESTS !== 'true') {
    throw new Error(
      'Explicit opt-in required. Set STAGE5_ALLOW_DB_TESTS=true only after verifying the selected database is disposable development/test data.'
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Check backend/.env before continuing.');
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL.');
  }

  const host = databaseUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, '').split('/')[0] || '');
  const localHosts = new Set([
    'localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres', 'db', 'database'
  ]);

  if (/(^|[_-])(prod|production|live)([_-]|$)/i.test(databaseName)) {
    throw new Error('Refusing to use a database whose name appears to indicate production/live data.');
  }

  if (!localHosts.has(host) && process.env.STAGE5_ALLOW_REMOTE_DB_TESTS !== 'true') {
    throw new Error(
      'Database host "' + host + '" is remote. Refusing by default. Only set STAGE5_ALLOW_REMOTE_DB_TESTS=true after independently confirming this is a disposable development/test database. Never use production.'
    );
  }

  return { host, databaseName: databaseName || '(database name unavailable)' };
}

function getUserIdentity(user, expected) {
  if (!user) return false;
  return user.email === expected.email &&
    user.username === expected.username &&
    user.role === expected.role &&
    user.profile?.tagline === FIXTURE_PROFILE_TAGLINE;
}

async function getOrCreateFixtureUser(tx, expected, passwordHash) {
  const existing = await tx.user.findUnique({
    where: { email: expected.email },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isDeleted: true,
      isBanned: true,
      isSuspended: true,
      profile: {
        select: {
          tagline: true,
          onboardingCompleted: true,
          onboardingStatus: true
        }
      }
    }
  });

  if (existing) {
    if (!getUserIdentity(existing, expected)) {
      throw new Error(
        'Safety stop: ' + expected.email + ' already exists but does not exactly match this fixture. No data was changed.'
      );
    }
    if (existing.isDeleted || existing.isBanned || existing.isSuspended) {
      throw new Error('Safety stop: the existing test account is deleted, banned, or suspended.');
    }
    if (
      existing.profile?.onboardingCompleted !== true ||
      existing.profile?.onboardingStatus !== 'COMPLETED'
    ) {
      throw new Error('Safety stop: existing fixture account onboarding is not complete. No profile was overwritten.');
    }
    return existing;
  }

  return tx.user.create({
    data: {
      username: expected.username,
      email: expected.email,
      passwordHash,
      firstName: expected.firstName,
      lastName: expected.lastName,
      fullName: expected.fullName,
      role: expected.role,
      isMinor: false,
      age: 24,
      profile: {
        create: {
          tagline: FIXTURE_PROFILE_TAGLINE,
          bio: 'Synthetic account reserved for Stage 5 offline Home-cache testing. Not a real person or marketplace participant.',
          category: expected.role === 'STUDENT_FREELANCER' ? 'Development' : 'Design',
          skills: expected.role === 'STUDENT_FREELANCER' ? ['Testing', 'Development'] : [],
          onboardingCompleted: true,
          onboardingStatus: 'COMPLETED',
          onboardingData: expected.role === 'CLIENT'
            ? {
                version: 1,
                role: 'CLIENT',
                hiringCategories: ['Development'],
                companyOrProjectName: 'Stage 5 Test Studio',
                fixture: 'STAGE5_OFFLINE_ORDER_TEST'
              }
            : {
                version: 1,
                role: 'STUDENT_FREELANCER',
                primaryDomain: 'Development',
                fixture: 'STAGE5_OFFLINE_ORDER_TEST'
              }
        }
      },
      wallet: {
        create: {
          availableBalance: 0,
          pendingBalance: 0,
          isParentAccount: false
        }
      }
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isDeleted: true,
      isBanned: true,
      isSuspended: true
    }
  });
}

async function seedFixture(prisma) {
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const studentExpected = {
    email: STUDENT_EMAIL,
    username: STUDENT_USERNAME,
    role: 'STUDENT_FREELANCER',
    firstName: 'Stage5',
    lastName: 'TestStudent',
    fullName: 'Stage 5 Test Student'
  };
  const clientExpected = {
    email: CLIENT_EMAIL,
    username: CLIENT_USERNAME,
    role: 'CLIENT',
    firstName: 'Stage5',
    lastName: 'TestClient',
    fullName: 'Stage 5 Test Client'
  };

  const fixture = await prisma.$transaction(async (tx) => {
    const student = await getOrCreateFixtureUser(tx, studentExpected, passwordHash);
    const client = await getOrCreateFixtureUser(tx, clientExpected, passwordHash);

    const gigs = await tx.gig.findMany({
      where: { sellerId: student.id, title: FIXTURE_GIG_TITLE },
      select: { id: true, title: true, description: true, status: true, isDeleted: true }
    });

    if (gigs.length > 1) {
      throw new Error('Safety stop: multiple matching fixture gigs exist. No data was changed.');
    }

    let gig = gigs[0];
    if (gig) {
      if (
        gig.description !== FIXTURE_GIG_DESCRIPTION ||
        gig.status !== 'PUBLISHED' ||
        gig.isDeleted
      ) {
        throw new Error('Safety stop: the existing matching gig was modified. No data was changed.');
      }
    } else {
      gig = await tx.gig.create({
        data: {
          sellerId: student.id,
          title: FIXTURE_GIG_TITLE,
          category: 'Development',
          description: FIXTURE_GIG_DESCRIPTION,
          coverImage: 'https://placehold.co/900x600/101827/10b981?text=Offline+Test+Gig',
          status: 'PUBLISHED',
          isDeleted: false
        },
        select: { id: true, title: true, description: true, status: true, isDeleted: true }
      });
    }

    const orders = await tx.order.findMany({
      where: { requirements: FIXTURE_ORDER_MARKER },
      select: {
        id: true,
        clientId: true,
        sellerId: true,
        gigId: true,
        status: true,
        requirements: true,
        razorpayOrderId: true,
        razorpayPaymentId: true
      }
    });

    if (orders.length > 1) {
      throw new Error('Safety stop: multiple matching fixture orders exist. No data was changed.');
    }

    let order = orders[0];
    if (order) {
      if (
        order.clientId !== client.id ||
        order.sellerId !== student.id ||
        order.gigId !== gig.id ||
        order.status !== 'IN_PROGRESS' ||
        order.razorpayOrderId ||
        order.razorpayPaymentId
      ) {
        throw new Error('Safety stop: the existing fixture order was modified or does not match this test. No data was changed.');
      }
    } else {
      order = await tx.order.create({
        data: {
          clientId: client.id,
          sellerId: student.id,
          gigId: gig.id,
          totalAmount: 1500,
          platformFee: 150,
          sellerEarnings: 1350,
          status: 'IN_PROGRESS',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          requirements: FIXTURE_ORDER_MARKER
        },
        select: {
          id: true,
          clientId: true,
          sellerId: true,
          gigId: true,
          status: true,
          deadline: true
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId: order.id,
          actorId: student.id,
          type: 'STAGE5_OFFLINE_TEST_FIXTURE',
          message: 'TEST DATA ONLY: Synthetic in-progress order for Android Home offline-cache validation. No payment was processed.',
          source: FIXTURE_EVENT_SOURCE,
          metadata: { synthetic: true, noPaymentProcessed: true }
        }
      });
    }

    return { student, client, gig, order };
  });

  console.log('\nPASS: Stage 5 active-order offline-cache fixture is ready.');
  console.log('Student login: ' + STUDENT_EMAIL);
  console.log('Client login:  ' + CLIENT_EMAIL);
  console.log('Password for both test accounts: ' + TEST_PASSWORD);
  console.log('Test order ID: ' + fixture.order.id);
  console.log('Order title:   ' + FIXTURE_GIG_TITLE);
  console.log('Order status:  ' + fixture.order.status);
  console.log('Synthetic amount: INR 1500 (display/test data only; no payment or transfer exists).');
  console.log('\nUse either dedicated account in the Android app and open Home while online first.');
  console.log('After validation, run: npm run cleanup:stage5-offline-order');
}

const COUNT_FIELDS = [
  'gigs', 'ordersAsSeller', 'ordersAsClient', 'jobsPosted', 'bidsPlaced',
  'reviewsWritten', 'reviewsReceived', 'messagesSent', 'payoutRequests',
  'notifications', 'disputesOpened', 'investigationActions', 'strikeLogs',
  'activityEvents', 'gigAnalyticsEvents', 'gigFavorites', 'gigRevisions',
  'customOffersAsBuyer', 'customOffersAsSeller', 'moderationLogs'
];

async function assertNoUnexpectedAccountActivity(tx, userId, expectedCounts) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      _count: { select: Object.fromEntries(COUNT_FIELDS.map((field) => [field, true])) }
    }
  });

  if (!user) throw new Error('Safety stop: expected fixture account is missing.');

  const unexpected = COUNT_FIELDS
    .filter((field) => (user._count[field] || 0) !== (expectedCounts[field] || 0))
    .map((field) => field + '=' + user._count[field] + ' (expected ' + (expectedCounts[field] || 0) + ')');

  if (unexpected.length) {
    throw new Error(
      'Safety stop: fixture account has unexpected associated data: ' + unexpected.join(', ') +
      '. Cleanup stopped without deleting anything.'
    );
  }
}

async function cleanupFixture(prisma) {
  await prisma.$transaction(async (tx) => {
    const student = await tx.user.findUnique({
      where: { email: STUDENT_EMAIL },
      select: {
        id: true, email: true, username: true, role: true, isDeleted: true, isBanned: true,
        isSuspended: true, profile: { select: { tagline: true, onboardingCompleted: true, onboardingStatus: true } }
      }
    });
    const client = await tx.user.findUnique({
      where: { email: CLIENT_EMAIL },
      select: {
        id: true, email: true, username: true, role: true, isDeleted: true, isBanned: true,
        isSuspended: true, profile: { select: { tagline: true, onboardingCompleted: true, onboardingStatus: true } }
      }
    });

    if (!student && !client) {
      const remainingOrders = await tx.order.count({ where: { requirements: FIXTURE_ORDER_MARKER } });
      if (remainingOrders) throw new Error('Safety stop: a fixture-marked order exists without its expected test accounts.');
      console.log('No Stage 5 offline-order fixture found; nothing to clean up.');
      return;
    }

    const studentExpected = {
      email: STUDENT_EMAIL, username: STUDENT_USERNAME, role: 'STUDENT_FREELANCER'
    };
    const clientExpected = {
      email: CLIENT_EMAIL, username: CLIENT_USERNAME, role: 'CLIENT'
    };
    if (
      !getUserIdentity(student, studentExpected) ||
      !getUserIdentity(client, clientExpected) ||
      student.isDeleted || student.isBanned || student.isSuspended ||
      client.isDeleted || client.isBanned || client.isSuspended
    ) {
      throw new Error('Safety stop: one or both accounts do not exactly match the dedicated fixture identities. No data was deleted.');
    }

    const gigs = await tx.gig.findMany({
      where: { sellerId: student.id, title: FIXTURE_GIG_TITLE },
      select: { id: true, title: true, description: true, status: true, isDeleted: true }
    });
    if (gigs.length > 1) throw new Error('Safety stop: multiple fixture gigs found. No data was deleted.');
    const gig = gigs[0];
    if (gig && gig.description !== FIXTURE_GIG_DESCRIPTION) {
      throw new Error('Safety stop: the gig content no longer matches the test fixture. No data was deleted.');
    }

    const orders = await tx.order.findMany({
      where: { requirements: FIXTURE_ORDER_MARKER },
      select: {
        id: true, clientId: true, sellerId: true, gigId: true, status: true,
        razorpayOrderId: true, razorpayPaymentId: true, razorpayRefundId: true
      }
    });
    if (orders.length > 1) throw new Error('Safety stop: multiple fixture orders found. No data was deleted.');
    const order = orders[0];

    if (order && (
      order.clientId !== client.id ||
      order.sellerId !== student.id ||
      order.gigId !== gig?.id ||
      order.razorpayOrderId ||
      order.razorpayPaymentId ||
      order.razorpayRefundId
    )) {
      throw new Error('Safety stop: fixture order identity/payment fields do not match. No data was deleted.');
    }

    if (gig) {
      const analyticsEventCount = await tx.gigAnalyticsEvent.count({
        where: { gigId: gig.id }
      });
      if (analyticsEventCount > 0) {
        throw new Error(
          'Safety stop: the fixture gig has ' + analyticsEventCount +
          ' analytics event(s). No data was deleted so test telemetry is preserved.'
        );
      }

      const otherGigOrders = await tx.order.count({
        where: { gigId: gig.id, ...(order ? { id: { not: order.id } } : {}) }
      });
      const packages = await tx.gigPackage.count({ where: { gigId: gig.id } });
      const extras = await tx.gigExtra.count({ where: { gigId: gig.id } });
      const revisions = await tx.gigRevision.count({ where: { gigId: gig.id } });
      const favorites = await tx.gigFavorite.count({ where: { gigId: gig.id } });
      const customOffers = await tx.gigCustomOffer.count({ where: { gigId: gig.id } });
      if (otherGigOrders || packages || extras || revisions || favorites || customOffers) {
        throw new Error('Safety stop: the fixture gig has additional marketplace activity. No data was deleted.');
      }
    }

    let fixtureEventCount = 0;
    if (order) {
      const children = {
        transfers: await tx.transfer.count({ where: { orderId: order.id } }),
        deliverables: await tx.deliverable.count({ where: { orderId: order.id } }),
        messages: await tx.message.count({ where: { orderId: order.id } }),
        reviews: await tx.review.count({ where: { orderId: order.id } }),
        disputes: await tx.dispute.count({ where: { orderId: order.id } }),
        notifications: await tx.notification.count({ where: { orderId: order.id } }),
        unrelatedEvents: await tx.orderActivityEvent.count({
          where: { orderId: order.id, source: { not: FIXTURE_EVENT_SOURCE } }
        })
      };
      const unsafeChild = Object.entries(children).find(([, count]) => count !== 0);
      if (unsafeChild) {
        throw new Error('Safety stop: the fixture order has associated ' + unsafeChild[0] + ' (' + unsafeChild[1] + '). No data was deleted.');
      }
      fixtureEventCount = await tx.orderActivityEvent.count({
        where: { orderId: order.id, source: FIXTURE_EVENT_SOURCE }
      });
      if (fixtureEventCount !== 1) {
        throw new Error('Safety stop: expected exactly one fixture-owned order event. No data was deleted.');
      }
    }

    const studentFixtureAnalyticsCount = gig
      ? await tx.gigAnalyticsEvent.count({ where: { actorId: student.id, gigId: gig.id } })
      : 0;
    const clientFixtureAnalyticsCount = gig
      ? await tx.gigAnalyticsEvent.count({ where: { actorId: client.id, gigId: gig.id } })
      : 0;

    await assertNoUnexpectedAccountActivity(tx, student.id, {
      gigs: gig ? 1 : 0,
      ordersAsSeller: order ? 1 : 0,
      activityEvents: order ? fixtureEventCount : 0,
      gigAnalyticsEvents: studentFixtureAnalyticsCount
    });
    await assertNoUnexpectedAccountActivity(tx, client.id, {
      ordersAsClient: order ? 1 : 0,
      gigAnalyticsEvents: clientFixtureAnalyticsCount
    });

    if (order) await tx.order.delete({ where: { id: order.id } });
    if (gig) {
      await tx.gig.delete({ where: { id: gig.id } });
    }
    await tx.user.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: client.id } });
  });

  console.log('PASS: Removed only the validated Stage 5 offline-order test fixture.');
  console.log('The script refused to clean up if unexpected activity or payment-linked data was found.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--cleanup') || args.length > 1) {
    throw new Error('Supported usage: run without arguments to seed, or pass --cleanup to remove the fixture.');
  }

  const target = assertSafeTestTarget();
  const prisma = require('../src/config/db');
  try {
    console.log('Selected database host: ' + target.host + '; database: ' + target.databaseName);
    if (args.includes('--cleanup')) {
      await cleanupFixture(prisma);
    } else {
      await seedFixture(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Stage 5 offline-order fixture did not complete.');
  console.error(error.message || error);
  process.exitCode = 1;
});
