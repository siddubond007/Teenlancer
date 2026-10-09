const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/config/db');
const {
  getHomeDiscovery,
  getProfileNudges
} = require('../src/controllers/homeDiscoveryController');

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

test('rejects discovery for roles outside the marketplace', async () => {
  const response = createResponse();

  await getHomeDiscovery({ user: { id: 'admin-1', role: 'ADMIN' } }, response);

  assert.equal(response.statusCode, 403);
  assert.match(response.body.error, /Student or Client/);
});

test('student discovery filters open jobs using saved skills', async () => {
  const response = createResponse();
  let capturedJobQuery;

  await withPrismaStubs([
    ['user', 'findUnique', async () => ({
      id: 'student-1',
      role: 'STUDENT_FREELANCER',
      profile: {
        skills: ['React Native'],
        category: 'Graphic Design',
        onboardingData: {}
      }
    })],
    ['job', 'findMany', async (query) => {
      capturedJobQuery = query;
      return [{
        id: 'job-1',
        title: 'Build a React Native screen',
        categoryId: null,
        budget: 1200,
        fixedBudget: 1200,
        minimumBudget: null,
        maximumBudget: null,
        skills: ['React Native'],
        taxonomySkills: [],
        createdAt: '2026-10-08T10:00:00.000Z'
      }];
    }]
  ], async () => {
    await getHomeDiscovery({
      user: { id: 'student-1', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.recommendedJobs.length, 1);
  assert.equal(response.body.recommendedJobs[0].id, 'job-1');
  assert.deepEqual(capturedJobQuery.where.OR[0].skills, {
    hasSome: ['React Native']
  });
  assert.deepEqual(capturedJobQuery.where.bids, {
    none: { studentId: 'student-1' }
  });
  assert.equal(capturedJobQuery.take, 24);
});

test('student with only placeholder preferences gets no unrelated jobs', async () => {
  const response = createResponse();
  let jobQueryCount = 0;

  await withPrismaStubs([
    ['user', 'findUnique', async () => ({
      id: 'student-2',
      role: 'STUDENT_FREELANCER',
      profile: {
        skills: ['Student Talent', 'Fast Learner'],
        category: 'Graphic Design',
        onboardingData: {}
      }
    })],
    ['job', 'findMany', async () => {
      jobQueryCount += 1;
      return [];
    }]
  ], async () => {
    await getHomeDiscovery({
      user: { id: 'student-2', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.recommendedJobs, []);
  assert.equal(jobQueryCount, 0);
});

test('client discovery applies every saved hiring category', async () => {
  const response = createResponse();
  let capturedGigQuery;

  await withPrismaStubs([
    ['user', 'findUnique', async () => ({
      id: 'client-1',
      role: 'CLIENT',
      profile: {
        skills: [],
        category: null,
        onboardingData: {
          hiringCategories: ['Design', 'Development']
        }
      }
    })],
    ['category', 'findMany', async () => ([
      { id: 'category-design', name: 'Design', slug: 'design' },
      { id: 'category-development', name: 'Development', slug: 'development' }
    ])],
    ['gig', 'findMany', async (query) => {
      capturedGigQuery = query;
      return [{
        id: 'gig-1',
        title: 'Mobile UI design',
        category: 'Design',
        categoryId: 'category-design',
        coverImage: null,
        updatedAt: '2026-10-08T10:00:00.000Z',
        seller: {
          fullName: 'Verified Student',
          averageRating: 4.8,
          profile: { avatarUrl: null }
        },
        packages: [{ price: 750 }]
      }];
    }]
  ], async () => {
    await getHomeDiscovery({
      user: { id: 'client-1', role: 'CLIENT' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.topVerifiedGigs.length, 1);
  assert.equal(response.body.topVerifiedGigs[0].startingPrice, 750);
  assert.ok(capturedGigQuery.where.OR.some((filter) =>
    filter.categoryId?.in?.includes('category-development')
  ));
  assert.ok(capturedGigQuery.where.OR.some((filter) =>
    filter.category?.equals === 'Design'
  ));
});

test('profile nudges are empty for a complete profile with proof of work', async () => {
  const response = createResponse();

  await withPrismaStubs([
    ['user', 'findUnique', async () => ({
      id: 'student-3',
      role: 'STUDENT_FREELANCER',
      verification: { status: 'APPROVED' },
      profile: {
        tagline: 'React Native developer',
        bio: 'I build accessible and reliable mobile experiences.',
        avatarUrl: 'https://cdn.example.com/student-3.png',
        college: 'Engineering College',
        category: 'Software Development',
        skills: ['React Native'],
        githubUrl: 'https://github.com/student-3',
        youtubeUrl: null,
        drivePortfolio: null,
        sampleFiles: [],
        portfolioItems: [],
        socialLinks: {},
        onboardingCompleted: true,
        onboardingStatus: 'COMPLETED',
        onboardingData: {
          primaryDomain: 'Software Development',
          selectedSkills: ['React Native']
        }
      }
    })]
  ], async () => {
    await getProfileNudges({
      user: { id: 'student-3', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, []);
});

test('profile nudges identify missing proof, skills, profile basics, and verification', async () => {
  const response = createResponse();

  await withPrismaStubs([
    ['user', 'findUnique', async () => ({
      id: 'student-4',
      role: 'STUDENT_FREELANCER',
      verification: null,
      profile: {
        tagline: 'Student Creator • Ready to Work',
        bio: 'Student Fresher ready to deliver quality work and build a verified portfolio.',
        avatarUrl: null,
        college: 'College / University',
        category: 'Graphic Design',
        skills: ['Student Talent', 'Fast Learner'],
        githubUrl: null,
        youtubeUrl: null,
        drivePortfolio: null,
        sampleFiles: [],
        portfolioItems: [],
        socialLinks: {},
        onboardingCompleted: false,
        onboardingStatus: 'IN_PROGRESS',
        onboardingData: {}
      }
    })]
  ], async () => {
    await getProfileNudges({
      user: { id: 'student-4', role: 'STUDENT_FREELANCER' }
    }, response);
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    response.body.map((nudge) => nudge.type),
    ['PORTFOLIO', 'SKILLS', 'PROFILE_BASICS', 'VERIFICATION']
  );
});
