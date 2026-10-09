require('dotenv').config();

const TEST_GIG_TITLE = '[STAGE5 TEST] Responsive UI/UX Design Portfolio';
const TEST_GIG_DESCRIPTION =
  'A development-only sample gig for verifying SkillLaunch marketplace discovery and the seven-day Marketplace Intelligence dashboard. Includes a responsive UI/UX concept, reusable components, and a clickable prototype handoff.';
const TEST_GIG_COVER =
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=85';
const TEST_PACKAGE_DESCRIPTION =
  'Stage 5 local test fixture package. This is not a real client offer.';
const EVENT_SOURCE = 'STAGE5_ANALYTICS_FIXTURE';
const DEFAULT_STUDENT_EMAIL =
  'stage4-nudge-test-1791550389594-638bda@example.com';

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to create a Stage 5 fixture when NODE_ENV=production.');
  }

  if (process.env.STAGE5_ALLOW_DB_TESTS !== 'true') {
    throw new Error(
      'Explicit opt-in required. Set STAGE5_ALLOW_DB_TESTS=true only after confirming this is a development/test database.'
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
    process.env.STAGE5_ALLOW_REMOTE_DB_TESTS !== 'true'
  ) {
    throw new Error(
      'Database host "' + databaseHost +
      '" is not local. The fixture is blocked by default for remote databases. ' +
      'Only set STAGE5_ALLOW_REMOTE_DB_TESTS=true after independently confirming ' +
      'the target is a disposable development/test database. Never run this against production.'
    );
  }
}

function buildSyntheticEvents(gigId, createdAtMillis) {
  const definitions = [
    { type: 'IMPRESSION', count: 24, intervalHours: 3, offsetHours: 1 },
    { type: 'VIEW', count: 8, intervalHours: 8, offsetHours: 2 },
    { type: 'PURCHASE_CLICK', count: 3, intervalHours: 24, offsetHours: 3 }
  ];

  return definitions.flatMap(({ type, count, intervalHours, offsetHours }) =>
    Array.from({ length: count }, (_, index) => ({
      gigId,
      actorId: null,
      type,
      eventId:
        'stage5-test-' + gigId + '-' + type + '-' +
        String(index + 1).padStart(3, '0'),
      metadata: {
        source: EVENT_SOURCE,
        synthetic: true,
        note: 'Development-only demo telemetry; not real marketplace activity.'
      },
      createdAt: new Date(
        createdAtMillis - (offsetHours + index * intervalHours) * 60 * 60 * 1000
      )
    }))
  );
}

async function main() {
  assertSafeTestTarget();

  // Import Prisma only after the explicit environment safety checks have passed.
  const prisma = require('../src/config/db');
  const studentEmail = (
    process.env.STAGE5_TEST_STUDENT_EMAIL || DEFAULT_STUDENT_EMAIL
  ).trim().toLowerCase();
  const cleanupRequested = process.argv.includes('--cleanup');

  try {
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        isSuspended: true,
        isDeleted: true
      }
    });

    if (!student) {
      throw new Error(
        'Student account "' + studentEmail +
        '" was not found. No account was created. Set STAGE5_TEST_STUDENT_EMAIL ' +
        'to the existing test account email.'
      );
    }

    if (
      student.role !== 'STUDENT_FREELANCER' ||
      student.isBanned ||
      student.isSuspended ||
      student.isDeleted
    ) {
      throw new Error(
        'Refusing to modify account "' + studentEmail +
        '": it must be an active, non-deleted STUDENT_FREELANCER account.'
      );
    }

    const existingGig = await prisma.gig.findFirst({
      where: {
        sellerId: student.id,
        title: TEST_GIG_TITLE
      },
      select: { id: true, title: true, status: true, isDeleted: true }
    });

    if (cleanupRequested) {
      if (!existingGig) {
        console.log('No Stage 5 fixture gig found for ' + student.email + '; nothing to remove.');
        return;
      }

      const orderCount = await prisma.order.count({
        where: { gigId: existingGig.id }
      });
      if (orderCount > 0) {
        throw new Error(
          'Refusing cleanup: the Stage 5 fixture gig has ' + orderCount +
          ' order(s). Review it manually rather than deleting order-related data.'
        );
      }

      const prefix = 'stage5-test-' + existingGig.id + '-';
      await prisma.$transaction(async (tx) => {
        await tx.gigAnalyticsEvent.deleteMany({
          where: {
            gigId: existingGig.id,
            eventId: { startsWith: prefix }
          }
        });
        await tx.gigPackage.deleteMany({
          where: {
            gigId: existingGig.id,
            tierName: 'Single',
            description: TEST_PACKAGE_DESCRIPTION
          }
        });
        await tx.gigExtra.deleteMany({
          where: { gigId: existingGig.id }
        });
        await tx.gigRevision.deleteMany({
          where: { gigId: existingGig.id }
        });
        await tx.gig.delete({
          where: { id: existingGig.id }
        });
      });

      console.log('Removed Stage 5 test gig and fixture-owned telemetry for ' + student.email + '.');
      console.log('No orders or student accounts were deleted.');
      return;
    }

    let gig;
    if (existingGig) {
      gig = await prisma.gig.update({
        where: { id: existingGig.id },
        data: {
          category: 'Design',
          description: TEST_GIG_DESCRIPTION,
          coverImage: TEST_GIG_COVER,
          isTiered: false,
          status: 'PUBLISHED',
          isDeleted: false,
          deletedAt: null
        },
        select: { id: true, title: true, status: true, sellerId: true }
      });
    } else {
      gig = await prisma.gig.create({
        data: {
          sellerId: student.id,
          title: TEST_GIG_TITLE,
          category: 'Design',
          description: TEST_GIG_DESCRIPTION,
          coverImage: TEST_GIG_COVER,
          isTiered: false,
          status: 'PUBLISHED'
        },
        select: { id: true, title: true, status: true, sellerId: true }
      });
    }

    const existingPackage = await prisma.gigPackage.findFirst({
      where: {
        gigId: gig.id,
        tierName: 'Single',
        description: TEST_PACKAGE_DESCRIPTION
      },
      select: { id: true }
    });

    if (existingPackage) {
      await prisma.gigPackage.update({
        where: { id: existingPackage.id },
        data: {
          price: 499,
          deliveryDays: 3,
          revisions: 2
        }
      });
    } else {
      await prisma.gigPackage.create({
        data: {
          gigId: gig.id,
          tierName: 'Single',
          price: 499,
          deliveryDays: 3,
          revisions: 2,
          description: TEST_PACKAGE_DESCRIPTION
        }
      });
    }

    const events = buildSyntheticEvents(gig.id, Date.now());
    const fixtureEventPrefix = 'stage5-test-' + gig.id + '-';

    // Refresh only the clearly tagged fixture events so repeat runs always fall
    // inside the current rolling seven-day window. Real events are untouched.
    await prisma.gigAnalyticsEvent.deleteMany({
      where: {
        gigId: gig.id,
        eventId: { startsWith: fixtureEventPrefix }
      }
    });

    const eventInsert = await prisma.gigAnalyticsEvent.createMany({
      data: events,
      skipDuplicates: true
    });

    const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const groupedEvents = await prisma.gigAnalyticsEvent.groupBy({
      by: ['type'],
      where: {
        gigId: gig.id,
        createdAt: { gte: periodStart },
        type: { in: ['IMPRESSION', 'VIEW', 'PURCHASE_CLICK'] }
      },
      _count: { _all: true }
    });
    const metrics = Object.fromEntries(
      groupedEvents.map((group) => [group.type, group._count._all])
    );

    console.log('\nPASS: Stage 5 analytics fixture is ready in the selected development/test database.');
    console.log('Student: ' + student.email);
    console.log('Gig:     ' + gig.title);
    console.log('Gig ID:  ' + gig.id);
    console.log('Status:  ' + gig.status);
    console.log('Package: Single — ₹499, 3-day delivery');
    console.log('Synthetic events inserted this run: ' + eventInsert.count);
    console.log('Rolling seven-day counts (includes database records in that window):');
    console.log('  Impressions: ' + (metrics.IMPRESSION || 0));
    console.log('  Views:       ' + (metrics.VIEW || 0));
    console.log('  Clicks:      ' + (metrics.PURCHASE_CLICK || 0));
    console.log('\nIMPORTANT: these events are explicitly tagged synthetic test telemetry, not real client activity.');
    console.log('The script creates/updates only the dedicated Stage 5 test gig for this existing student.');
    console.log('After UI testing, run: npm run cleanup:stage5-analytics-gig');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Stage 5 analytics test gig was not prepared.');
  console.error(error.message || error);
  process.exitCode = 1;
});
