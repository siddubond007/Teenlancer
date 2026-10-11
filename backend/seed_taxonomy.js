const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
  'postgres',
  'db',
  'database'
]);
const RESTRICTED_CATEGORIES = new Set(['Legal Services']);

function assertSafeTestTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed taxonomy when NODE_ENV=production.');
  }

  if (process.env.STUDENT_EXPLORE_ALLOW_DB_TESTS !== 'true') {
    throw new Error(
      'Explicit opt-in required. Set STUDENT_EXPLORE_ALLOW_DB_TESTS=true only after confirming this is a local development/test database.'
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

  if (!LOCAL_DATABASE_HOSTS.has(databaseHost)) {
    throw new Error(
      'Database host "' + databaseHost + '" is not local. Refusing to write taxonomy data.'
    );
  }

  console.log('Taxonomy seed target host:', databaseHost);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  assertSafeTestTarget();

  // Keep the backend taxonomy aligned to the existing Jobs category source
  // rather than maintaining a second, smaller list of marketplace domains.
  const { JOB_CATEGORIES, JOB_CATEGORIES_DATA } = await import(
    '../apps/web/src/data/jobsCategoriesData.js'
  );

  let categoryCount = 0;
  let subcategoryCount = 0;
  let skillCount = 0;

  for (const categoryName of JOB_CATEGORIES) {
    const isRestricted = RESTRICTED_CATEGORIES.has(categoryName);
    const category = await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: { name: categoryName, isRestricted },
      create: {
        name: categoryName,
        slug: slugify(categoryName),
        isRestricted
      }
    });
    categoryCount += 1;

    const subcategories = JOB_CATEGORIES_DATA[categoryName] || {};
    for (const [subcategoryName, rawSkills] of Object.entries(subcategories)) {
      const subcategorySlug = slugify(categoryName + '-' + subcategoryName);
      const subcategory = await prisma.subcategory.upsert({
        where: { slug: subcategorySlug },
        update: { name: subcategoryName, categoryId: category.id },
        create: {
          name: subcategoryName,
          slug: subcategorySlug,
          categoryId: category.id
        }
      });
      subcategoryCount += 1;

      const uniqueSkills = [...new Set(
        (Array.isArray(rawSkills) ? rawSkills : [])
          .filter((skillName) => typeof skillName === 'string' && skillName.trim())
          .map((skillName) => skillName.trim())
      )];

      for (const skillName of uniqueSkills) {
        const skillSlug = slugify(
          categoryName + '-' + subcategoryName + '-' + skillName
        );
        await prisma.skill.upsert({
          where: { slug: skillSlug },
          update: { name: skillName, subcategoryId: subcategory.id },
          create: {
            name: skillName,
            slug: skillSlug,
            subcategoryId: subcategory.id
          }
        });
        skillCount += 1;
      }
    }
  }

  console.log('\nPASS: Jobs taxonomy seed completed.');
  console.log('Canonical categories processed:', categoryCount);
  console.log('Canonical subcategories processed:', subcategoryCount);
  console.log('Canonical skills processed:', skillCount);
  console.log('Public categories:', categoryCount - RESTRICTED_CATEGORIES.size);
  console.log('Restricted categories:', [...RESTRICTED_CATEGORIES].join(', '));
  console.log('No existing categories, subcategories, or skills were deleted.');
}

main()
  .catch((error) => {
    console.error('\nFAIL: taxonomy seed stopped.');
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
