require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');

const CLIENT_EMAIL_PREFIX = 'student-explore-demo-client-';
const CLIENT_COUNT = 12;
const TARGET_JOB_COUNT = 120;
const CLIENT_PROFILE_MARKER = 'Student Explore demo fixture — synthetic test account';
const JOB_TITLE_PREFIX = '[DEMO JOB ';
const JOB_DESCRIPTION_MARKER = 'SYNTHETIC TEST DATA ONLY — ';
const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
  'postgres',
  'db',
  'database'
]);

const TITLE_TEMPLATES = [
  'Create a practical {focus} deliverable',
  'Improve an existing {focus} workflow',
  'Build a student-friendly {focus} solution',
  'Research and document {focus} opportunities',
  'Create a launch-ready {focus} prototype',
  'Audit and improve {focus} quality',
  'Develop a polished {focus} experience',
  'Prepare a complete {focus} campaign',
  'Create reusable {focus} assets',
  'Plan and deliver a {focus} project'
];

const DESCRIPTION_TEMPLATES = [
  'The demo client needs a clear, well-organized first version that is easy to review. Share a short plan, deliver the agreed scope, and include concise handover notes.',
  'Please review the current requirements, propose a practical approach, and deliver a complete student-scale project. Keep files organized and explain the important decisions.',
  'The goal is to compare discovery, communication, and proposal workflows with a realistic brief. Include a short progress update and a final checklist of completed work.',
  'Prepare a clean, accessible result that follows the supplied brief. The client will review quality, responsiveness, clarity, and whether all requested deliverables are included.'
];

const SKILL_FALLBACKS = [
  'Research',
  'Communication',
  'Problem Solving',
  'Documentation'
];

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed synthetic jobs when NODE_ENV=production.');
  }

  if (process.env.STUDENT_EXPLORE_ALLOW_DB_TESTS !== 'true') {
    throw new Error(
      'Explicit opt-in required. Set STUDENT_EXPLORE_ALLOW_DB_TESTS=true only after confirming this is a disposable development/test database.'
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

  if (
    !LOCAL_DATABASE_HOSTS.has(databaseHost) &&
    process.env.STUDENT_EXPLORE_ALLOW_REMOTE_DB_TESTS !== 'true'
  ) {
    throw new Error(
      'Database host "' + databaseHost + '" is not local. Refusing to write. Only set STUDENT_EXPLORE_ALLOW_REMOTE_DB_TESTS=true after independently confirming the remote target is a disposable development database.'
    );
  }

  console.log('Synthetic Explore data target host:', databaseHost);
}

function cleanStrings(values, limit = 4) {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const text = value.trim();
    const key = text.toLocaleLowerCase('en-IN');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function makeFocus(category, subcategory) {
  return (subcategory && subcategory.name) || category.name;
}

function makeJobData(index, category, subcategory, clientId, skillRows) {
  const focus = makeFocus(category, subcategory);
  const template = TITLE_TEMPLATES[index % TITLE_TEMPLATES.length];
  const description = DESCRIPTION_TEMPLATES[index % DESCRIPTION_TEMPLATES.length];
  const skills = cleanStrings([
    ...skillRows.map((skill) => skill.name),
    focus,
    ...SKILL_FALLBACKS
  ], 4);
  const skillIds = skillRows.slice(0, 4).map((skill) => skill.id);
  const budget = 1800 + ((index * 1379) % 32800);
  const isFixed = index % 3 === 0;
  const timelineOptions = ['1_WEEK', '2_WEEKS', '1_MONTH', '2_MONTHS'];
  const ageDays = index % 60;

  const data = {
    clientId,
    title: JOB_TITLE_PREFIX + String(index + 1).padStart(3, '0') + '] ' +
      category.name + ': ' + template.replace('{focus}', focus),
    category: category.name,
    categoryId: category.id,
    subcategory: subcategory?.name || null,
    subcategoryId: subcategory?.id || null,
    projectType: 'ONE_TIME',
    description: JOB_DESCRIPTION_MARKER + description +
      ' This brief is for local UI testing only; it is not a real client request and no payment or hiring commitment exists.',
    deliverables: [
      'A completed first version',
      'A short handover note',
      'A checklist of included deliverables'
    ],
    requirements: 'Synthetic demo brief. Confirm scope in the proposal before starting.',
    skills,
    experienceLevel: ['BEGINNER', 'INTERMEDIATE', 'INTERMEDIATE', 'ADVANCED'][index % 4],
    budgetType: isFixed ? 'FIXED' : 'RANGE',
    fixedBudget: isFixed ? budget : null,
    minimumBudget: isFixed ? null : Math.max(500, Math.floor(budget * 0.8)),
    maximumBudget: isFixed ? null : Math.ceil(budget * 1.25),
    budget,
    currency: 'INR',
    startPreference: 'ASAP',
    deadlineType: timelineOptions[index % timelineOptions.length],
    timeline: timelineOptions[index % timelineOptions.length],
    reviewWindow: 5,
    visibility: 'PUBLIC',
    preferredLocation: 'ANYWHERE_INDIA',
    preferredState: null,
    preferredCity: null,
    locationPreferences: 'Remote / Anywhere in India',
    preferredLanguages: ['English'],
    languagePreferences: 'English',
    screeningQuestions: [],
    ndaRequired: false,
    currentStep: 5,
    status: 'OPEN',
    isOpen: true,
    isDeleted: false,
    createdAt: new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000)
  };

  if (skillIds.length) {
    data.taxonomySkills = { connect: skillIds.map((id) => ({ id })) };
  }

  return data;
}

async function getOrCreateDemoClients(prisma) {
  const passwordHash = await bcrypt.hash(
    'SyntheticExploreFixture-' + require('node:crypto').randomBytes(24).toString('hex'),
    10
  );
  const clients = [];

  for (let index = 1; index <= CLIENT_COUNT; index += 1) {
    const number = String(index).padStart(2, '0');
    const email = CLIENT_EMAIL_PREFIX + number + '@local.test';
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { profile: { select: { tagline: true } } }
    });

    if (existing) {
      if (
        existing.role !== 'CLIENT' ||
        !existing.profile?.tagline?.startsWith(CLIENT_PROFILE_MARKER)
      ) {
        throw new Error(
          'Refusing to reuse existing account ' + email +
          ': it is not marked as a Student Explore demo fixture.'
        );
      }
      clients.push(existing);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        username: 'explore_demo_client_' + number,
        email,
        passwordHash,
        firstName: 'Explore Demo',
        lastName: 'Client ' + number,
        fullName: 'Demo Client ' + number,
        role: 'CLIENT',
        isMinor: false,
        age: 25,
        profile: {
          create: {
            tagline: CLIENT_PROFILE_MARKER,
            bio: 'Synthetic test-only client used to populate the local Student Explore and Home discovery screens.',
            category: 'Demo Marketplace',
            skills: [],
            badges: [],
            onboardingCompleted: true,
            onboardingStatus: 'COMPLETED',
            onboardingData: { clientType: 'SMALL_BUSINESS', hiringCategories: [] }
          }
        }
      },
      include: { profile: { select: { tagline: true } } }
    });
    clients.push(created);
  }

  return clients;
}

async function seed(prisma) {
  const categories = await prisma.category.findMany({
    where: { isRestricted: false },
    orderBy: { name: 'asc' },
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
        include: { skills: { orderBy: { name: 'asc' } } }
      }
    }
  });

  if (!categories.length) {
    throw new Error(
      'No non-restricted taxonomy categories were found. Seed the app taxonomy first; this script will not invent or replace platform domains.'
    );
  }

  const targetCount = Math.max(TARGET_JOB_COUNT, categories.length);
  if (targetCount > 150) {
    throw new Error(
      'Found ' + categories.length + ' non-restricted domains, so covering each domain would exceed the requested 150-job maximum. No jobs were created.'
    );
  }

  const clients = await getOrCreateDemoClients(prisma);
  let createdCount = 0;
  let existingCount = 0;
  const countsByCategory = new Map();

  for (let index = 0; index < targetCount; index += 1) {
    const category = categories[index % categories.length];
    const subcategories = category.subcategories || [];
    const subcategory = subcategories.length
      ? subcategories[Math.floor(index / categories.length) % subcategories.length]
      : null;
    const skillRows = subcategory?.skills || [];
    const client = clients[index % clients.length];
    const data = makeJobData(index, category, subcategory, client.id, skillRows);

    const existing = await prisma.job.findFirst({
      where: { title: data.title, clientId: client.id },
      select: { id: true }
    });

    if (existing) {
      existingCount += 1;
    } else {
      await prisma.job.create({ data });
      createdCount += 1;
    }

    countsByCategory.set(
      category.name,
      (countsByCategory.get(category.name) || 0) + 1
    );
  }

  const demoJobs = await prisma.job.count({
    where: {
      title: { startsWith: JOB_TITLE_PREFIX },
      client: { is: { email: { startsWith: CLIENT_EMAIL_PREFIX } } },
      isDeleted: false
    }
  });

  console.log('\nPASS: Student Explore synthetic marketplace data is ready.');
  console.log('Synthetic open jobs present:', demoJobs);
  console.log('Jobs created this run:', createdCount);
  console.log('Jobs already present:', existingCount);
  console.log('Non-restricted taxonomy domains covered:', categories.length);
  console.log('Demo client accounts:', clients.length);
  console.log('\nJobs by domain:');
  for (const [name, count] of [...countsByCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(' - ' + name + ': ' + count);
  }
  console.log('\nEvery demo job title starts with "[DEMO JOB " and every description is marked synthetic.');
  console.log('No bids, orders, payments, payouts, or transfers are created.');
  console.log('Cleanup command: npm run cleanup:student-explore-demo-jobs');
}

async function cleanup(prisma) {
  const jobs = await prisma.job.findMany({
    where: {
      title: { startsWith: JOB_TITLE_PREFIX },
      client: { is: { email: { startsWith: CLIENT_EMAIL_PREFIX } } }
    },
    select: {
      id: true,
      title: true,
      orders: { select: { id: true, status: true } }
    }
  });

  const jobsWithOrders = jobs.filter((job) => job.orders.length > 0);
  if (jobsWithOrders.length) {
    throw new Error(
      'Cleanup stopped: ' + jobsWithOrders.length +
      ' synthetic jobs have orders. Review those orders manually; no demo jobs or accounts were deleted.'
    );
  }

  if (jobs.length) {
    await prisma.job.deleteMany({
      where: { id: { in: jobs.map((job) => job.id) } }
    });
  }

  const clients = await prisma.user.findMany({
    where: {
      email: { startsWith: CLIENT_EMAIL_PREFIX },
      role: 'CLIENT',
      profile: { is: { tagline: { startsWith: CLIENT_PROFILE_MARKER } } }
    },
    include: {
      profile: { select: { tagline: true } },
      _count: {
        select: {
          jobsPosted: true,
          gigs: true,
          ordersAsClient: true
        }
      }
    }
  });

  let deletedClients = 0;
  for (const client of clients) {
    if (
      client._count.jobsPosted === 0 &&
      client._count.gigs === 0 &&
      client._count.ordersAsClient === 0
    ) {
      await prisma.user.delete({ where: { id: client.id } });
      deletedClients += 1;
    }
  }

  console.log('\nPASS: Student Explore synthetic data cleanup completed.');
  console.log('Demo jobs removed:', jobs.length);
  console.log('Unused marked demo client accounts removed:', deletedClients);
  console.log('Accounts with other content were preserved.');
}

async function main() {
  assertSafeTestTarget();
  const prisma = require('../src/config/db');
  try {
    if (process.argv.includes('--cleanup')) {
      await cleanup(prisma);
    } else {
      await seed(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nFAIL: Student Explore demo data operation stopped.');
  console.error(error.message || error);
  process.exitCode = 1;
});
