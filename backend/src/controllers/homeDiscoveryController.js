const prisma = require('../config/db');

const DEFAULT_SKILLS = new Set(['student talent', 'fast learner']);
const DEFAULT_CATEGORY = 'graphic design';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cleanStrings(values, limit = 30) {
  if (!Array.isArray(values)) return [];

  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    const normalized = trimmed.toLocaleLowerCase('en-IN');
    if (!trimmed || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en-IN') : '';
}

function slugify(value) {
  return normalizeValue(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function meaningfulString(value, placeholders = []) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const normalized = normalizeValue(value);
  return !placeholders.some((placeholder) => normalizeValue(placeholder) === normalized);
}

async function resolveCategories(values) {
  const preferences = cleanStrings(values, 25);
  if (preferences.length === 0) return [];

  const slugs = [...new Set(preferences.map(slugify).filter(Boolean))];
  return prisma.category.findMany({
    where: {
      OR: [
        { id: { in: preferences } },
        ...(slugs.length ? [{ slug: { in: slugs, mode: 'insensitive' } }] : []),
        { name: { in: preferences, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
}

function hasPortfolioProof(profile, onboardingData) {
  const socialLinks = asObject(profile.socialLinks);
  const relevantSocialLinks = Object.entries(socialLinks).some(([key, value]) =>
    /portfolio|github|figma|behance|dribbble|drive|youtube/i.test(key) &&
    typeof value === 'string' &&
    value.trim()
  );

  return [
    profile.githubUrl,
    profile.youtubeUrl,
    profile.drivePortfolio,
    onboardingData.githubUrl,
    onboardingData.youtubeUrl,
    onboardingData.portfolioUrl
  ].some((value) => typeof value === 'string' && value.trim()) ||
    (Array.isArray(profile.portfolioItems) && profile.portfolioItems.length > 0) ||
    (Array.isArray(profile.sampleFiles) && profile.sampleFiles.length > 0) ||
    relevantSocialLinks;
}

function formatBudgetLabel(job) {
  const fixed = Number(job.fixedBudget);
  const minimum = Number(job.minimumBudget);
  const maximum = Number(job.maximumBudget);
  const budget = Number(job.budget);

  if (Number.isFinite(fixed) && fixed > 0) return '₹' + Math.round(fixed);
  if (
    Number.isFinite(minimum) && minimum > 0 &&
    Number.isFinite(maximum) && maximum > 0
  ) {
    return '₹' + Math.round(minimum) + '–₹' + Math.round(maximum);
  }
  if (Number.isFinite(budget) && budget > 0) return '₹' + Math.round(budget);
  return 'Budget on request';
}

function toRecommendedJob(job) {
  return {
    id: job.id,
    title: job.title,
    budgetLabel: formatBudgetLabel(job),
    skills: Array.isArray(job.skills) ? job.skills.filter(Boolean).slice(0, 3) : [],
    createdAt: job.createdAt
  };
}

function toVerifiedGig(gig) {
  return {
    id: gig.id,
    title: gig.title,
    sellerName: gig.seller?.fullName || 'Verified student',
    sellerAvatarUrl: gig.seller?.profile?.avatarUrl || null,
    rating: Number(gig.seller?.averageRating || 0),
    startingPrice: Math.round(Number(gig.packages?.[0]?.price || 0)),
    coverImage: gig.coverImage || null
  };
}

exports.getHomeDiscovery = async (req, res) => {
  try {
    if (!req.user || !['STUDENT_FREELANCER', 'CLIENT'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Home discovery is available only to Student or Client accounts.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        profile: {
          select: {
            category: true,
            skills: true,
            onboardingData: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user was not found.' });
    }

    const profile = user.profile || {};
    const onboardingData = asObject(profile.onboardingData);

    if (user.role === 'STUDENT_FREELANCER') {
      // Merge saved profile and onboarding skills, excluding schema placeholder defaults.
      const studentSkills = cleanStrings([
        ...(Array.isArray(profile.skills) ? profile.skills : []),
        ...(Array.isArray(onboardingData.selectedSkills) ? onboardingData.selectedSkills : [])
      ]).filter((skill) => !DEFAULT_SKILLS.has(normalizeValue(skill)));

      const categoryPreferences = cleanStrings([
        onboardingData.primaryDomain,
        onboardingData.categoryId,
        onboardingData.selectedCategoryId,
        meaningfulString(profile.category, [DEFAULT_CATEGORY]) ? profile.category : null
      ], 15);
      const matchedCategories = await resolveCategories(categoryPreferences);
      const categoryIds = matchedCategories.map((category) => category.id);

      const matchFilters = [];
      if (studentSkills.length) {
        matchFilters.push({ skills: { hasSome: studentSkills } });
        matchFilters.push({
          taxonomySkills: {
            some: { name: { in: studentSkills, mode: 'insensitive' } }
          }
        });
      }
      if (categoryIds.length) {
        matchFilters.push({ categoryId: { in: categoryIds } });
      }

      let jobs = [];
      if (matchFilters.length) {
        jobs = await prisma.job.findMany({
          where: {
            clientId: { not: user.id },
            client: {
              is: {
                role: 'CLIENT',
                isBanned: false,
                isSuspended: false,
                isDeleted: false
              }
            },
            status: { in: ['OPEN', 'PUBLISHED', 'published'] },
            isOpen: true,
            isDeleted: false,
            orders: {
              none: {
                status: {
                  in: [
                    'PENDING_PAYMENT',
                    'FUNDED_IN_ESCROW',
                    'REQUIREMENTS_SUBMITTED',
                    'IN_PROGRESS',
                    'DELIVERED',
                    'REVISION_REQUESTED',
                    'IN_REVIEW',
                    'DISPUTED'
                  ]
                }
              }
            },
            bids: { none: { studentId: user.id } },
            OR: matchFilters
          },
          select: {
            id: true,
            title: true,
            categoryId: true,
            budget: true,
            fixedBudget: true,
            minimumBudget: true,
            maximumBudget: true,
            skills: true,
            taxonomySkills: { select: { name: true } },
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 24
        });
      }

      const normalizedSkills = new Set(studentSkills.map(normalizeValue));
      const matchedCategoryIds = new Set(categoryIds);
      jobs.sort((left, right) => {
        const score = (job) => {
          const jobSkills = new Set([
            ...(job.skills || []),
            ...(job.taxonomySkills || []).map((skill) => skill.name)
          ].map(normalizeValue));
          const skillScore = [...normalizedSkills].filter((skill) => jobSkills.has(skill)).length * 2;
          const categoryScore = matchedCategoryIds.has(job.categoryId) ? 3 : 0;
          return skillScore + categoryScore;
        };
        const scoreDifference = score(right) - score(left);
        if (scoreDifference !== 0) return scoreDifference;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

      return res.json({
        role: user.role,
        discoveryCategory: null,
        recommendedJobs: jobs.slice(0, 6).map(toRecommendedJob),
        topVerifiedGigs: []
      });
    }

    // Use every selected hiring category; an empty preference list returns no suggestions.
    const hiringCategories = cleanStrings(onboardingData.hiringCategories, 25);
    const categories = await resolveCategories(hiringCategories);
    const categoryIds = categories.map((category) => category.id);
    const legacyCategoryValues = cleanStrings([
      ...hiringCategories,
      ...categories.map((category) => category.name),
      ...categories.map((category) => category.slug)
    ], 75);

    const categoryFilters = [];
    if (categoryIds.length) categoryFilters.push({ categoryId: { in: categoryIds } });
    if (legacyCategoryValues.length) {
      categoryFilters.push({
        category: { in: legacyCategoryValues, mode: 'insensitive' }
      });
    }

    let gigs = [];
    if (categoryFilters.length) {
      gigs = await prisma.gig.findMany({
        where: {
          status: 'PUBLISHED',
          isDeleted: false,
          OR: categoryFilters,
          seller: {
            is: {
              role: 'STUDENT_FREELANCER',
              isBanned: false,
              isSuspended: false,
              isDeleted: false,
              verification: { status: 'APPROVED' }
            }
          }
        },
        select: {
          id: true,
          title: true,
          category: true,
          categoryId: true,
          coverImage: true,
          updatedAt: true,
          seller: {
            select: {
              fullName: true,
              averageRating: true,
              profile: { select: { avatarUrl: true } }
            }
          },
          packages: {
            select: { price: true },
            orderBy: { price: 'asc' },
            take: 1
          }
        },
        orderBy: [
          { seller: { averageRating: 'desc' } },
          { updatedAt: 'desc' }
        ],
        take: 6
      });
    }

    return res.json({
      role: user.role,
      discoveryCategory: categories[0]?.name || hiringCategories[0] || null,
      recommendedJobs: [],
      topVerifiedGigs: gigs.map(toVerifiedGig)
    });
  } catch (error) {
    console.error('Home Discovery Error:', error);
    return res.status(500).json({ error: 'Failed to load personalized discovery.' });
  }
};

exports.getProfileNudges = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT_FREELANCER') {
      return res.status(403).json({
        error: 'Profile nudges are available only to Student Freelancer accounts.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        verification: { select: { status: true } },
        profile: {
          select: {
            tagline: true,
            bio: true,
            avatarUrl: true,
            college: true,
            category: true,
            skills: true,
            githubUrl: true,
            youtubeUrl: true,
            drivePortfolio: true,
            sampleFiles: true,
            portfolioItems: true,
            socialLinks: true,
            onboardingCompleted: true,
            onboardingStatus: true,
            onboardingData: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user was not found.' });
    }

    const profile = user.profile || {};
    const onboardingData = asObject(profile.onboardingData);
    const savedSkills = cleanStrings([
      ...(Array.isArray(profile.skills) ? profile.skills : []),
      ...(Array.isArray(onboardingData.selectedSkills) ? onboardingData.selectedSkills : [])
    ]).filter((skill) => !DEFAULT_SKILLS.has(normalizeValue(skill)));
    const nudges = [];

    if (!hasPortfolioProof(profile, onboardingData)) {
      nudges.push({
        id: 'portfolio-proof',
        type: 'PORTFOLIO',
        title: 'Stand out to clients',
        subtitle: 'Add a portfolio link or work sample so clients can review the quality of your work.',
        actionLabel: 'Update Profile'
      });
    }

    if (savedSkills.length === 0) {
      nudges.push({
        id: 'skills',
        type: 'SKILLS',
        title: 'Make your skills easy to find',
        subtitle: 'Add your strongest skills so matching projects can discover you.',
        actionLabel: 'Update Profile'
      });
    }

    const hasCustomTagline = meaningfulString(profile.tagline, ['Student Creator • Ready to Work']);
    const hasCustomBio = meaningfulString(profile.bio, [
      'Student Fresher ready to deliver quality work and build a verified portfolio.'
    ]);
    const hasCollege = meaningfulString(profile.college, ['College / University']);
    const hasCategory = meaningfulString(profile.category, [DEFAULT_CATEGORY]) ||
      meaningfulString(onboardingData.primaryDomain);
    if (!profile.avatarUrl || !hasCustomTagline || !hasCustomBio || !hasCollege || !hasCategory) {
      nudges.push({
        id: 'profile-basics',
        type: 'PROFILE_BASICS',
        title: 'Tell clients what you do best',
        subtitle: 'Add a personal profile photo, a clear introduction, and your study or work focus.',
        actionLabel: 'Update Profile'
      });
    }

    const verificationStatus = user.verification?.status;
    // Pending or rejected verification already appears in the urgent Home action queue.
    if (!verificationStatus || !['APPROVED', 'PENDING', 'REJECTED'].includes(verificationStatus)) {
      nudges.push({
        id: 'verification',
        type: 'VERIFICATION',
        title: 'Build trust with verification',
        subtitle: 'Complete student verification to strengthen the trust signals clients see on your profile.',
        actionLabel: 'Update Profile'
      });
    }

    // Once all profile and proof-of-work signals are present, the inbox is intentionally empty.
    return res.json(nudges);
  } catch (error) {
    console.error('Profile Nudges Error:', error);
    return res.status(500).json({ error: 'Failed to load profile nudges.' });
  }
};
