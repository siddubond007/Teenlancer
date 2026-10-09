const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/config/db');
const { getHomeAnalytics } = require('../src/controllers/homeAnalyticsController');
const { recordGigAnalytics } = require('../src/controllers/gigController');

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

async function withPrismaStubs(stubs, run) {
  const originals = [];

  for (const [modelName, methodName, implementation] of stubs) {
    const model = prisma[modelName];
    originals.push({
      model,
      methodName,
      implementation: model[methodName]
    });
    model[methodName] = implementation;
  }

  try {
    await run();
  } finally {
    for (const original of originals.reverse()) {
      original.model[original.methodName] = original.implementation;
    }
  }
}

test('Home analytics rejects non-student roles', async () => {
  const response = createResponse();
  await getHomeAnalytics({ user: { id: 'client-1', role: 'CLIENT' } }, response);

  assert.equal(response.statusCode, 403);
  assert.match(response.body.error, /Student Freelancer/);
});

test('Home analytics aggregates a rolling seven-day window across published student gigs', async () => {
  const response = createResponse();
  let capturedGigQuery;
  let capturedEventQuery;
  let capturedOrderQuery;

  await withPrismaStubs([
    ['gig', 'findMany', async (query) => {
      capturedGigQuery = query;
      return [
        { id: 'gig-1', title: 'React UI Service', category: 'Development' },
        { id: 'gig-2', title: 'Brand Design', category: 'Design' }
      ];
    }],
    ['gigAnalyticsEvent', 'groupBy', async (query) => {
      capturedEventQuery = query;
      return [
        { gigId: 'gig-1', type: 'IMPRESSION', _count: { _all: 100 } },
        { gigId: 'gig-1', type: 'VIEW', _count: { _all: 30 } },
        { gigId: 'gig-1', type: 'PURCHASE_CLICK', _count: { _all: 10 } },
        { gigId: 'gig-2', type: 'IMPRESSION', _count: { _all: 50 } },
        { gigId: 'gig-2', type: 'VIEW', _count: { _all: 8 } },
        { gigId: 'gig-2', type: 'PURCHASE_CLICK', _count: { _all: 5 } }
      ];
    }],
    ['order', 'groupBy', async (query) => {
      capturedOrderQuery = query;
      return [
        { gigId: 'gig-1', _count: { _all: 2 } },
        { gigId: 'gig-2', _count: { _all: 1 } }
      ];
    }]
  ], async () => {
    await getHomeAnalytics({
      user: { id: 'student-1', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.periodDays, 7);
  assert.equal(response.body.publishedGigCount, 2);
  assert.deepEqual(response.body.totals, {
    impressions: 150,
    views: 38,
    clicks: 15,
    orders: 3,
    conversionRate: 2
  });
  assert.deepEqual(response.body.gigs[0], {
    gigId: 'gig-1',
    title: 'React UI Service',
    category: 'Development',
    impressions: 100,
    views: 30,
    clicks: 10,
    orders: 2,
    conversionRate: 2
  });

  assert.equal(capturedGigQuery.where.sellerId, 'student-1');
  assert.equal(capturedGigQuery.where.status, 'PUBLISHED');
  assert.equal(capturedGigQuery.where.isDeleted, false);
  assert.deepEqual(capturedEventQuery.where.gigId, { in: ['gig-1', 'gig-2'] });
  assert.deepEqual(capturedEventQuery.where.type.in, ['IMPRESSION', 'VIEW', 'PURCHASE_CLICK']);
  assert.equal(capturedOrderQuery.where.status, 'COMPLETED');

  const periodStart = capturedEventQuery.where.createdAt.gte;
  const periodEnd = capturedEventQuery.where.createdAt.lte;
  assert.ok(periodStart instanceof Date);
  assert.ok(periodEnd instanceof Date);
  assert.equal(periodEnd.getTime() - periodStart.getTime(), 7 * 24 * 60 * 60 * 1000);
  assert.equal(
    capturedOrderQuery.where.updatedAt.gte.getTime(),
    periodStart.getTime()
  );
  assert.equal(
    capturedOrderQuery.where.updatedAt.lte.getTime(),
    periodEnd.getTime()
  );
});

test('Home analytics returns honest empty metrics when the student has no published gigs', async () => {
  const response = createResponse();
  let aggregateCalls = 0;

  await withPrismaStubs([
    ['gig', 'findMany', async () => []],
    ['gigAnalyticsEvent', 'groupBy', async () => {
      aggregateCalls += 1;
      return [];
    }],
    ['order', 'groupBy', async () => {
      aggregateCalls += 1;
      return [];
    }]
  ], async () => {
    await getHomeAnalytics({
      user: { id: 'student-empty', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.publishedGigCount, 0);
  assert.deepEqual(response.body.totals, {
    impressions: 0,
    views: 0,
    clicks: 0,
    orders: 0,
    conversionRate: 0
  });
  assert.deepEqual(response.body.gigs, []);
  assert.equal(aggregateCalls, 0);
});

test('gig analytics event recorder accepts explicit impression events', async () => {
  const response = createResponse();
  let createdEvent;

  await withPrismaStubs([
    ['gig', 'findFirst', async () => ({ id: 'gig-public', sellerId: 'seller-1' })],
    ['gigAnalyticsEvent', 'create', async ({ data }) => {
      createdEvent = data;
      return data;
    }]
  ], async () => {
    await recordGigAnalytics({
      params: { gigId: 'gig-public' },
      body: {
        type: 'IMPRESSION',
        eventId: 'home-impression-event-001'
      },
      user: { id: 'client-1', role: 'CLIENT' }
    }, response);
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.recorded, true);
  assert.equal(createdEvent.type, 'IMPRESSION');
  assert.equal(createdEvent.gigId, 'gig-public');
});
