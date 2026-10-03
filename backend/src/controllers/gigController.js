const prisma = require('../config/db');
const { moderateGig } = require('../services/gigModerationService');
const {
  createGigRevision,
  createGigPendingEditRevision
} = require('../services/gigRevisionService');
const {
  getGigAvailability,
  validateGigAvailability
} = require('../services/gigAvailabilityService');
const {
  validateGigOrderCapacity
} = require('../services/gigOrderCapacityService');

async function createAuditLog(adminId, actionType, targetId = null, details = null) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        actionType,
        targetId,
        details
      }
    });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

exports.createGig = async (req, res) => {
  try {
    const { title, category, categoryId, subcategoryId, description, coverImage, isTiered, packages } = req.body;
    const gig = await prisma.gig.create({
      data: {
        sellerId: req.user.id,
        title,
        category,
        categoryId,
        subcategoryId,
        description,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
        isTiered: isTiered || false,
        packages: {
          create: packages || [{ tierName: 'Single', price: 499, deliveryDays: 2, revisions: 2, description: 'Standard student delivery' }]
        }
      },
      include: { packages: true, seller: { select: { fullName: true, age: true, profile: true } } }
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getGigById = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        status: 'PUBLISHED',
        isDeleted: false
      },
      include: {
        packages: {
          where: {
            tierName: {
              in: ['Single', 'Basic', 'Standard', 'Premium']
            }
          },
          orderBy: { price: 'asc' }
        },
        extras: {
          orderBy: { id: 'asc' }
        },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            age: true,
            averageRating: true,
            totalReviews: true,
            points: true,
            profile: {
              select: {
                avatarUrl: true,
                tagline: true,
                bio: true,
                college: true,
                category: true,
                hourlyRate: true,
                skills: true,
                badges: true,
                responseTimeExpectation: true
              }
            },
            verification: {
              select: {
                status: true,
                collegeIdStatus: true,
                govtIdStatus: true
              }
            }
          }
        }
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const favoriteCount = await prisma.gigFavorite.count({
      where: { gigId: gig.id }
    });

    const favorited = req.user?.id
      ? Boolean(await prisma.gigFavorite.findUnique({
          where: {
            gigId_userId: {
              gigId: gig.id,
              userId: req.user.id
            }
          },
          select: { id: true }
        }))
      : false;

    const activePackageNames = gig.isTiered
      ? new Set(['Basic', 'Standard', 'Premium'])
      : new Set(['Single']);

    return res.json({
      ...gig,
      packages: gig.packages.filter((pkg) =>
        activePackageNames.has(pkg.tierName)
      ),
      analytics: {
        favorites: favoriteCount,
        favorited
      }
    });
  } catch (err) {
    console.error('Get Gig By ID Error:', err);
    return res.status(500).json({ error: 'Failed to load gig.' });
  }
};


const GIG_ANALYTICS_EVENT_TYPES = new Set(['VIEW', 'PURCHASE_CLICK']);

const normalizeEventId = (value) => {
  const eventId = String(value || '').trim();
  return eventId.length >= 8 && eventId.length <= 120 ? eventId : null;
};

exports.recordGigAnalytics = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { type, eventId, metadata } = req.body || {};

    if (!GIG_ANALYTICS_EVENT_TYPES.has(type)) {
      return res.status(400).json({ error: 'Unsupported analytics event.' });
    }

    const normalizedEventId = normalizeEventId(eventId);
    if (!normalizedEventId) {
      return res.status(400).json({ error: 'A valid eventId is required.' });
    }

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        status: 'PUBLISHED',
        isDeleted: false
      },
      select: {
        id: true,
        sellerId: true
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    // The seller's own traffic is not a marketplace performance signal.
    if (req.user?.id === gig.sellerId) {
      return res.json({ recorded: false, ignored: 'OWNER_VIEW' });
    }

    await prisma.gigAnalyticsEvent.create({
      data: {
        gigId: gig.id,
        actorId: req.user?.id || null,
        type,
        eventId: normalizedEventId,
        metadata:
          metadata && typeof metadata === 'object' && !Array.isArray(metadata)
            ? metadata
            : null
      }
    });

    return res.status(201).json({ recorded: true });
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.json({ recorded: false, duplicate: true });
    }

    console.error('Record Gig Analytics Error:', err);
    return res.status(500).json({ error: 'Failed to record analytics event.' });
  }
};

exports.toggleGigFavorite = async (req, res) => {
  try {
    if (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only client accounts can favorite gigs.'
      });
    }

    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        status: 'PUBLISHED',
        isDeleted: false
      },
      select: { id: true }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const existing = await prisma.gigFavorite.findUnique({
      where: {
        gigId_userId: {
          gigId,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      await prisma.gigFavorite.delete({ where: { id: existing.id } });

      const favorites = await prisma.gigFavorite.count({
        where: { gigId }
      });

      return res.json({ favorited: false, favorites });
    }

    await prisma.gigFavorite.create({
      data: {
        gigId,
        userId: req.user.id
      }
    });

    const favorites = await prisma.gigFavorite.count({
      where: { gigId }
    });

    return res.status(201).json({ favorited: true, favorites });
  } catch (err) {
    console.error('Toggle Gig Favorite Error:', err);
    return res.status(500).json({ error: 'Failed to update gig favorite.' });
  }
};

exports.getGigAnalytics = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        sellerId: req.user.id,
        isDeleted: false
      },
      select: { id: true }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const [eventGroups, favoriteCount, completedOrderAggregate] = await Promise.all([
      prisma.gigAnalyticsEvent.groupBy({
        by: ['type'],
        where: { gigId },
        _count: { _all: true }
      }),
      prisma.gigFavorite.count({
        where: { gigId }
      }),
      prisma.order.aggregate({
        where: {
          gigId,
          status: 'COMPLETED'
        },
        _count: { _all: true },
        _sum: {
          totalAmount: true,
          sellerEarnings: true
        }
      })
    ]);

    const counts = Object.fromEntries(
      eventGroups.map((group) => [group.type, group._count._all])
    );

    const views = counts.VIEW || 0;
    const clicks = counts.PURCHASE_CLICK || 0;
    const orders = completedOrderAggregate._count._all || 0;
    const revenue = Number(completedOrderAggregate._sum.totalAmount || 0);
    const sellerRevenue = Number(completedOrderAggregate._sum.sellerEarnings || 0);

    return res.json({
      gigId,
      views,
      clicks,
      favorites: favoriteCount,
      orders,
      conversionRate: views > 0
        ? Number(((orders / views) * 100).toFixed(2))
        : 0,
      revenue,
      sellerRevenue
    });
  } catch (err) {
    console.error('Get Gig Analytics Error:', err);
    return res.status(500).json({ error: 'Failed to load gig analytics.' });
  }
};

exports.getMyGigs = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT_FREELANCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only Student Freelancer accounts can view their gigs.'
      });
    }

    const gigs = await prisma.gig.findMany({
      where: {
        sellerId: req.user.id,
        isDeleted: false
      },
      include: {
        packages: {
          orderBy: { price: 'asc' }
        },
        orders: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const result = gigs.map((gig) => {
      const activePackageNames = gig.isTiered
        ? new Set(['Basic', 'Standard', 'Premium'])
        : new Set(['Single']);

      return {
        ...gig,
        packages: gig.packages.filter((pkg) =>
          activePackageNames.has(pkg.tierName)
        )
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Get My Gigs Error:', err);
    return res.status(500).json({ error: 'Failed to load your gigs.' });
  }
};

exports.getGigs = async (req, res) => {
  try {
    const gigs = await prisma.gig.findMany({
      where: {
        status: 'PUBLISHED',
        isDeleted: false
      },
      include: {
        packages: {
          where: {
            tierName: {
              in: ['Single', 'Basic', 'Standard', 'Premium']
            }
          },
          orderBy: { price: 'asc' }
        },
        extras: {
          orderBy: { id: 'asc' }
        },
        seller: {
          select: { id: true, fullName: true, age: true, profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const result = gigs.map((gig) => {
      const activePackageNames = gig.isTiered
        ? new Set(['Basic', 'Standard', 'Premium'])
        : new Set(['Single']);

      return {
        ...gig,
        packages: gig.packages.filter((pkg) =>
          activePackageNames.has(pkg.tierName)
        )
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const stripHtmlToText = (value) =>
  String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|ul|ol)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const validateGigSubmission = (draftData) => {
  const blockers = [];
  const addBlocker = (step, field, message, detail = null) => {
    blockers.push({ step, field, message, detail });
  };

  const basics = draftData?.basics || {};
  const pricing = draftData?.pricing || {};
  const delivery = draftData?.delivery || {};

  const availabilityError = validateGigAvailability(draftData);
  if (availabilityError) {
    addBlocker(
      4,
      availabilityError.field,
      'Complete your availability settings.',
      availabilityError.detail
    );
  }

  const orderCapacityError = validateGigOrderCapacity(draftData);
  if (orderCapacityError) {
    addBlocker(
      4,
      orderCapacityError.field,
      'Complete your active-order capacity settings.',
      orderCapacityError.detail
    );
  }

  const requirements = Array.isArray(draftData?.requirements)
    ? draftData.requirements
    : [];

  const allowedUsageRightsPolicies = new Set([
    'buyer-owns-final-work',
    'license-commercial-use',
    'license-personal-use',
    'portfolio-display-only'
  ]);

  if (!allowedUsageRightsPolicies.has(String(draftData?.usageRightsPolicy || '').trim())) {
    addBlocker(
      8,
      'usageRightsPolicy',
      'Select a usage and ownership policy.',
      'Choose the structured usage and ownership policy that applies to this gig before submitting it for review.'
    );
  }

  if (draftData?.platformRulesAcknowledged !== true) {
    addBlocker(
      8,
      'platformRulesAcknowledged',
      'Acknowledge the marketplace rules.',
      'You must agree to the marketplace rules before submitting this gig for review.'
    );
  }

  const media = draftData?.media || {};
  const gallery = Array.isArray(media.gallery) ? media.gallery : [];

  const portfolioLinks = Array.isArray(media.portfolioLinks)
    ? media.portfolioLinks
    : [];

  portfolioLinks.forEach((link, index) => {
    try {
      const parsed = new URL(String(link || '').trim());
      if (!/^(https?:)$/i.test(parsed.protocol) || !parsed.hostname) {
        throw new Error('unsupported protocol');
      }
    } catch {
      addBlocker(
        6,
        `media.portfolioLinks.${index}`,
        'Fix your portfolio links.',
        'Each portfolio link must be a valid http:// or https:// URL.'
      );
    }
  });

  const liveDemoUrl = String(media.liveDemoUrl || '').trim();
  if (liveDemoUrl) {
    try {
      const parsed = new URL(liveDemoUrl);
      if (!/^(https?:)$/i.test(parsed.protocol) || !parsed.hostname) {
        throw new Error('unsupported protocol');
      }
    } catch {
      addBlocker(
        6,
        'media.liveDemoUrl',
        'Fix your live demo URL.',
        'The live demo URL must be a valid http:// or https:// URL.'
      );
    }
  }

  const discovery =
    draftData?.discovery && typeof draftData.discovery === 'object'
      ? draftData.discovery
      : {};
  const discoveryLanguages = new Set([
    'English',
    'Hindi',
    'Telugu',
    'Tamil',
    'Kannada',
    'Malayalam',
    'Marathi',
    'Bengali',
    'Gujarati',
    'Punjabi',
    'Urdu',
    'Other'
  ]);
  const discoveryAudiences = new Set([
    'School students',
    'College & university students',
    'Job seekers',
    'Working professionals',
    'Startups & founders',
    'Small businesses',
    'Creators & influencers',
    'Researchers & academics',
    'Educators & teachers',
    'Developers & technical teams',
    'General consumers'
  ]);

  const keywords = Array.isArray(discovery.keywords)
    ? discovery.keywords
    : [];
  if (keywords.length > 10) {
    addBlocker(
      7,
      'discovery.keywords',
      'Fix your discovery metadata.',
      'Use up to 10 discovery keywords.'
    );
  } else {
    keywords.forEach((keyword, index) => {
      const value = String(keyword || '').trim();
      if (!value || value.length > 40) {
        addBlocker(
          7,
          `discovery.keywords.${index}`,
          'Fix your discovery metadata.',
          'Each discovery keyword must contain 1–40 characters.'
        );
      }
    });
  }

  const languages = Array.isArray(discovery.languages)
    ? discovery.languages
    : [];
  languages.forEach((language, index) => {
    if (!discoveryLanguages.has(language)) {
      addBlocker(
        7,
        `discovery.languages.${index}`,
        'Fix your discovery metadata.',
        'Choose languages from the available controlled options.'
      );
    }
  });

  const targetAudience = Array.isArray(discovery.targetAudience)
    ? discovery.targetAudience
    : [];
  targetAudience.forEach((audience, index) => {
    if (!discoveryAudiences.has(audience)) {
      addBlocker(
        7,
        `discovery.targetAudience.${index}`,
        'Fix your discovery metadata.',
        'Choose target audiences from the available controlled options.'
      );
    }
  });

  const title = String(basics.title || '').trim();
  if (title.length < 3 || title.length > 120) {
    addBlocker(
      1,
      'title',
      'Complete your service basics.',
      title
        ? 'Title must be between 3 and 120 characters.'
        : 'Add a service title.'
    );
  }

  if (!String(basics.categoryId || '').trim()) {
    addBlocker(1, 'categoryId', 'Complete your service basics.', 'Select a primary category.');
  }

  if (!String(basics.subcategoryId || '').trim()) {
    addBlocker(1, 'subcategoryId', 'Complete your service basics.', 'Select a subcategory.');
  }

  if (!String(basics.serviceType || '').trim()) {
    addBlocker(1, 'serviceType', 'Complete your service basics.', 'Select a service type.');
  }

  const description = stripHtmlToText(draftData?.description);
  if (description.length < 50) {
    addBlocker(
      2,
      'description',
      'Add a meaningful service description.',
      description
        ? 'The description needs at least 50 meaningful characters.'
        : 'A service description is required.'
    );
  }

  const rawPrice = String(pricing.basePrice ?? '').trim();
  const price = Number(rawPrice);
  const isMultiPackage = pricing.packageModel === 'multi';

  if (!isMultiPackage && (!rawPrice || !Number.isFinite(price) || !(price > 0))) {
    addBlocker(
      3,
      'basePrice',
      'Complete your pricing.',
      !rawPrice
        ? 'Enter a base price.'
        : 'Base price must be greater than 0.'
    );
  }

  if (!String(pricing.currency || '').trim()) {
    addBlocker(3, 'currency', 'Complete your pricing.', 'Select a currency.');
  }

  if (isMultiPackage) {
    const packageRows = getDraftPackagePayload(draftData);

    if (packageRows.length !== 3) {
      addBlocker(
        3,
        'packages',
        'Complete your package pricing.',
        'Add Basic, Standard, and Premium package details.'
      );
    } else {
      const seenTiers = new Set();

      packageRows.forEach((pkg) => {
        seenTiers.add(pkg.tierName);

        if (!Number.isFinite(pkg.price) || !(pkg.price > 0)) {
          addBlocker(
            3,
            `packages.${pkg.tierName}.price`,
            'Complete your package pricing.',
            `${pkg.tierName} price must be greater than 0.`
          );
        }

        if (!Number.isInteger(pkg.deliveryDays) || pkg.deliveryDays <= 0) {
          addBlocker(
            4,
            `packages.${pkg.tierName}.deliveryDays`,
            'Complete package delivery details.',
            `${pkg.tierName} delivery time must be a positive whole number of days.`
          );
        }

        if (
          !Number.isInteger(pkg.revisions) ||
          pkg.revisions < -1
        ) {
          addBlocker(
            4,
            `packages.${pkg.tierName}.revisions`,
            'Complete package revision details.',
            `${pkg.tierName} revisions must be 0 or more, or unlimited.`
          );
        }

        if (pkg.scope.includedItems.length === 0) {
          addBlocker(
            4,
            `packages.${pkg.tierName}.includedItems`,
            'Complete package scope.',
            `${pkg.tierName} needs at least one included item.`
          );
        }

        if (pkg.scope.deliverables.length === 0) {
          addBlocker(
            4,
            `packages.${pkg.tierName}.deliverables`,
            'Complete package deliverables.',
            `${pkg.tierName} needs at least one deliverable.`
          );
        }

        if (pkg.features.length === 0) {
          addBlocker(
            4,
            `packages.${pkg.tierName}.features`,
            'Complete package features.',
            `${pkg.tierName} needs at least one package feature.`
          );
        }
      });

      PACKAGE_TIER_NAMES.forEach((tierName) => {
        if (!seenTiers.has(tierName)) {
          addBlocker(
            3,
            'packages',
            'Complete your package pricing.',
            `${tierName} package is required.`
          );
        }
      });
    }
  }

  const rawDelivery = String(delivery.deliveryDays ?? '').trim();
  const deliveryDays = Number(rawDelivery);
  if (
    !isMultiPackage &&
    (!rawDelivery ||
      !Number.isInteger(deliveryDays) ||
      !(deliveryDays > 0))
  ) {
    addBlocker(
      4,
      'deliveryDays',
      'Complete your scope and delivery details.',
      !rawDelivery
        ? 'Set a delivery time.'
        : 'Delivery time must be a positive whole number of days.'
    );
  }

  const rawRevisions = String(delivery.revisions ?? '').trim();
  const revisions = Number(rawRevisions);
  if (
    !isMultiPackage &&
    (!rawRevisions ||
      (rawRevisions !== 'unlimited' &&
        (!Number.isInteger(revisions) || revisions < 0)))
  ) {
    addBlocker(
      4,
      'revisions',
      'Complete your scope and delivery details.',
      !rawRevisions
        ? 'Select a revision allowance.'
        : 'Revision allowance must be 0 or more, or unlimited.'
    );
  }

  const validateList = (items, field, label) => {
    const normalized = Array.isArray(items) ? items : [];
    const hasMeaningful = normalized.some(
      (item) => String(item || '').trim().length > 0
    );
    const hasBlank = normalized.some(
      (item) => String(item || '').trim().length === 0
    );

    if (!hasMeaningful) {
      addBlocker(
        4,
        field,
        'Complete your scope and delivery details.',
        `Add at least one ${label}.`
      );
    } else if (hasBlank) {
      addBlocker(
        4,
        field,
        'Complete your scope and delivery details.',
        `Complete all ${label} or remove blank items.`
      );
    }
  };

  if (!isMultiPackage) {
    validateList(delivery.includedItems, 'includedItems', 'included item');
    validateList(delivery.deliverables, 'deliverables', 'deliverable');
  }

  const excludedItems = Array.isArray(delivery.excludedItems)
    ? delivery.excludedItems
    : [];
  if (
    !isMultiPackage &&
    excludedItems.length > 0 &&
    excludedItems.some((item) => String(item || '').trim().length === 0)
  ) {
    addBlocker(
      4,
      'excludedItems',
      'Complete your scope and delivery details.',
      'Complete or remove blank excluded items.'
    );
  }

  const extras = Array.isArray(draftData?.extras)
    ? draftData.extras
    : [];

  extras.forEach((extra, index) => {
    const prefix = `extras.${extra?.id || index}`;
    const title = String(extra?.title || '').trim();
    const rawExtraPrice = String(extra?.price ?? '').trim();
    const extraPrice = Number(rawExtraPrice);
    const scopeDescription =
      extra?.scope &&
      typeof extra.scope === 'object'
        ? String(extra.scope.description || '').trim()
        : '';

    if (!title) {
      addBlocker(
        3,
        `${prefix}.title`,
        'Complete your optional extras.',
        'Every extra needs a meaningful title.'
      );
    }

    if (
      !rawExtraPrice ||
      !Number.isFinite(extraPrice) ||
      !(extraPrice > 0)
    ) {
      addBlocker(
        3,
        `${prefix}.price`,
        'Complete your optional extras.',
        'Extra price must be greater than 0.'
      );
    }

    if (!scopeDescription) {
      addBlocker(
        3,
        `${prefix}.scope`,
        'Complete your optional extras.',
        'Every extra needs a meaningful scope.'
      );
    }
  });

  if (requirements.length === 0) {
    addBlocker(
      5,
      'requirements',
      'Complete your buyer requirements.',
      'Add at least one buyer requirement.'
    );
  } else {
    requirements.forEach((requirement, index) => {
      const prefix = `requirements.${requirement?.id || index}`;
      const questionValid =
        String(requirement?.question || '').trim().length > 0;
      const typeValid = Boolean(requirement?.type);
      const requiredValid = typeof requirement?.required === 'boolean';

      if (!typeValid || !requiredValid || !questionValid) {
        addBlocker(
          5,
          prefix,
          'Complete your buyer requirements.',
          'Every requirement needs a meaningful question and valid type settings.'
        );
      }

      if (requirement?.type === 'multiple-choice') {
        const options = Array.isArray(requirement.options)
          ? requirement.options
          : [];
        const meaningfulOptions = options.filter(
          (option) => String(option || '').trim().length > 0
        );

        if (meaningfulOptions.length < 2) {
          addBlocker(
            5,
            prefix,
            'Complete your buyer requirements.',
            'Multiple-choice requirements need at least two meaningful choices.'
          );
        }
      }
    });
  }

  if (!media.cover) {
    addBlocker(6, 'media.cover', 'Fix your media.', 'Add a cover image.');
  } else if (media.cover.validationError) {
    addBlocker(
      6,
      'media.cover',
      'Fix your media.',
      String(media.cover.validationError)
    );
  }

  const invalidGallery = gallery.find((item) => item?.validationError);
  if (invalidGallery) {
    addBlocker(
      6,
      `media.gallery.${invalidGallery.id || 'item'}`,
      'Fix your media.',
      'Fix or remove invalid gallery images.'
    );
  }

  const video = media.video;
  if (video) {
    if (video.validationError) {
      addBlocker(
        6,
        'media.video',
        'Fix your media.',
        String(video.validationError)
      );
    } else if (String(video.url || '').trim()) {
      try {
        const parsed = new URL(String(video.url).trim());
        if (!/^(https?:)$/i.test(parsed.protocol) || !parsed.hostname) {
          throw new Error('unsupported protocol');
        }
      } catch {
        addBlocker(
          6,
          'media.video',
          'Fix your media.',
          'The service introduction video URL must be a valid http:// or https:// URL.'
        );
      }
    } else {
      addBlocker(
        6,
        'media.video',
        'Fix your media.',
        'Upload the service introduction video again before continuing.'
      );
    }
  }

  return blockers;
};

const normalizeDraftVersion = (value) => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 0 ? version : 0;
};

const canonicalizeJson = (value) => {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalizeJson(value[key]);
        return result;
      }, {});
  }

  return value;
};

const areDraftsEqual = (left, right) =>
  JSON.stringify(canonicalizeJson(left)) ===
  JSON.stringify(canonicalizeJson(right));

const PACKAGE_TIER_NAMES = ['Basic', 'Standard', 'Premium'];

const normalizePackageList = (items) =>
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

const normalizePackageDraft = (pkg, fallbackTierName) => {
  const scope = pkg?.scope && typeof pkg.scope === 'object' ? pkg.scope : {};

  return {
    id: typeof pkg?.id === 'string' ? pkg.id : null,
    tierName:
      PACKAGE_TIER_NAMES.includes(String(pkg?.tierName || ''))
        ? String(pkg.tierName)
        : fallbackTierName,
    price: Number(pkg?.price),
    deliveryDays: Number(pkg?.deliveryDays),
    revisions:
      pkg?.revisions === 'unlimited'
        ? -1
        : Number(pkg?.revisions),
    description:
      typeof pkg?.description === 'string' && pkg.description.trim()
        ? pkg.description.trim()
        : `${fallbackTierName} service package`,
    scope: {
      includedItems: normalizePackageList(scope.includedItems),
      excludedItems: normalizePackageList(scope.excludedItems),
      deliverables: normalizePackageList(scope.deliverables)
    },
    features: normalizePackageList(pkg?.features)
  };
};

const normalizeExtraDraft = (extra) => {
  const scope =
    extra?.scope && typeof extra.scope === 'object'
      ? extra.scope
      : {};

  return {
    id: typeof extra?.id === 'string' ? extra.id : null,
    title:
      typeof extra?.title === 'string'
        ? extra.title.trim()
        : '',
    price: Number(extra?.price),
    scope: {
      description:
        typeof scope.description === 'string'
          ? scope.description.trim()
          : ''
    }
  };
};

const getDraftExtraPayload = (draftData) => {
  if (!Array.isArray(draftData?.extras)) return [];

  return draftData.extras
    .filter((extra) => extra && typeof extra === 'object')
    .map(normalizeExtraDraft);
};

const syncGigExtras = async (tx, gigId, draftData) => {
  const desiredExtras = getDraftExtraPayload(draftData);
  const existingExtras = await tx.gigExtra.findMany({
    where: { gigId },
    orderBy: { id: 'asc' }
  });

  const existingById = new Map(
    existingExtras.map((extra) => [extra.id, extra])
  );

  for (const desired of desiredExtras) {
    const data = {
      title: desired.title,
      price: Number.isFinite(desired.price) ? desired.price : 0,
      scope: desired.scope
    };

    if (desired.id && existingById.has(desired.id)) {
      await tx.gigExtra.update({
        where: { id: desired.id },
        data
      });
      existingById.delete(desired.id);
    } else {
      await tx.gigExtra.create({
        data: {
          gigId,
          ...data
        }
      });
    }
  }

  const staleIds = [...existingById.keys()];

  if (staleIds.length > 0) {
    await tx.gigExtra.deleteMany({
      where: {
        gigId,
        id: { in: staleIds }
      }
    });
  }

  return tx.gigExtra.findMany({
    where: { gigId },
    orderBy: { id: 'asc' }
  });
};

const getDraftPackagePayload = (draftData) => {
  const pricing = draftData?.pricing || {};
  const delivery = draftData?.delivery || {};

  if (pricing.packageModel !== 'multi') {
    const revisions =
      delivery.revisions === 'unlimited'
        ? -1
        : Number(delivery.revisions);

    return [{
      tierName: 'Single',
      price: Number(pricing.basePrice),
      deliveryDays: Number(delivery.deliveryDays),
      revisions,
      description: 'Standard student delivery',
      scope: {
        includedItems: normalizePackageList(delivery.includedItems),
        excludedItems: normalizePackageList(delivery.excludedItems),
        deliverables: normalizePackageList(delivery.deliverables)
      },
      features: []
    }];
  }

  if (!Array.isArray(draftData?.packages)) return [];

  return draftData.packages
    .filter(
      (pkg) =>
        pkg &&
        PACKAGE_TIER_NAMES.includes(String(pkg.tierName || ''))
    )
    .map((pkg) => normalizePackageDraft(pkg, String(pkg.tierName)));
};

const syncGigPackages = async (tx, gigId, draftData) => {
  const desiredPackages = getDraftPackagePayload(draftData);
  const existingPackages = await tx.gigPackage.findMany({
    where: { gigId },
    orderBy: { price: 'asc' },
    include: {
      orders: {
        select: { id: true },
        take: 1
      }
    }
  });

  const existingByTier = new Map(
    existingPackages.map((pkg) => [pkg.tierName, pkg])
  );

  const isMulti = draftData?.pricing?.packageModel === 'multi';

  for (const desired of desiredPackages) {
    let existing = existingByTier.get(desired.tierName);

    if (!existing && isMulti && desired.tierName === 'Basic') {
      const singlePackage = existingByTier.get('Single');
      if (singlePackage && singlePackage.orders.length === 0) {
        existing = singlePackage;
      }
    }

    const data = {
      tierName: desired.tierName,
      price: Number.isFinite(desired.price) ? desired.price : 0,
      deliveryDays:
        Number.isInteger(desired.deliveryDays) && desired.deliveryDays > 0
          ? desired.deliveryDays
          : 1,
      revisions:
        Number.isInteger(desired.revisions) && desired.revisions >= -1
          ? desired.revisions
          : 0,
      description: desired.description,
      scope: desired.scope,
      features: desired.features
    };

    if (existing) {
      await tx.gigPackage.update({
        where: { id: existing.id },
        data
      });
      existingByTier.delete(existing.tierName);
      if (isMulti && desired.tierName === 'Basic') {
        existingByTier.delete('Basic');
      }
    } else {
      await tx.gigPackage.create({
        data: {
          gigId,
          ...data
        }
      });
    }
  }

  const desiredTierNames = new Set(
    desiredPackages.map((pkg) => pkg.tierName)
  );

  const removableStalePackages = existingPackages.filter(
    (pkg) =>
      !desiredTierNames.has(pkg.tierName) &&
      Array.isArray(pkg.orders) &&
      pkg.orders.length === 0
  );

  if (removableStalePackages.length > 0) {
    await tx.gigPackage.deleteMany({
      where: {
        gigId,
        id: {
          in: removableStalePackages.map((pkg) => pkg.id)
        },
        orders: {
          none: {}
        }
      }
    });
  }

  return tx.gigPackage.findMany({
    where: { gigId },
    orderBy: { price: 'asc' }
  });
};

const draftResponse = (gig) => ({
  id: gig.id,
  status: gig.status,
  moderationStatus: gig.moderationStatus,
  moderationReasonCode: gig.moderationReasonCode,
  moderationFindings: gig.moderationFindings || null,
  moderatedById: gig.moderatedById,
  moderatedAt: gig.moderatedAt,
  draftData: gig.draftData || {},
  draftVersion: gig.draftVersion,
  updatedAt: gig.updatedAt
});

const resolveDraftTaxonomyIds = async (draftData, fallback = {}) => {
  const categorySlug =
    typeof draftData?.basics?.categoryId === 'string'
      ? draftData.basics.categoryId.trim()
      : '';

  const subcategorySlug =
    typeof draftData?.basics?.subcategoryId === 'string'
      ? draftData.basics.subcategoryId.trim()
      : '';

  let categoryId =
    Object.prototype.hasOwnProperty.call(fallback, 'categoryId')
      ? fallback.categoryId
      : null;

  let subcategoryId =
    Object.prototype.hasOwnProperty.call(fallback, 'subcategoryId')
      ? fallback.subcategoryId
      : null;

  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true }
    });

    categoryId = category?.id || null;
  } else {
    categoryId = null;
  }

  if (subcategorySlug) {
    const subcategory = await prisma.subcategory.findUnique({
      where: { slug: subcategorySlug },
      select: { id: true, categoryId: true }
    });

    if (
      subcategory &&
      (!categoryId || subcategory.categoryId === categoryId)
    ) {
      subcategoryId = subcategory.id;
    } else {
      subcategoryId = null;
    }
  } else {
    subcategoryId = null;
  }

  return {
    categoryId,
    subcategoryId
  };
};

exports.createGigDraft = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT_FREELANCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only Student Freelancer accounts can create gig drafts.'
      });
    }

    const { draftData, draftVersion } = req.body;

    if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
      return res.status(400).json({ error: 'draftData must be a JSON object.' });
    }

    const clientVersion = normalizeDraftVersion(draftVersion);
    const { categoryId, subcategoryId } = await resolveDraftTaxonomyIds(draftData);

    const pricing = draftData?.pricing || {};
    const delivery = draftData?.delivery || {};
    const parsedPrice = Number(pricing.basePrice);
    const parsedDays = Number(delivery.deliveryDays);
    const parsedRevisions =
      delivery.revisions === 'unlimited'
        ? -1
        : Number(delivery.revisions);

    const gig = await prisma.$transaction(async (tx) => {
      const createdGig = await tx.gig.create({
        data: {
          sellerId: req.user.id,
          title: typeof draftData?.basics?.title === 'string'
            ? draftData.basics.title
            : 'Untitled Draft',
          category: typeof draftData?.basics?.categoryId === 'string'
            ? draftData.basics.categoryId
            : '',
          categoryId,
          subcategoryId,
          description: typeof draftData.description === 'string'
            ? draftData.description
            : '',
          coverImage: typeof draftData?.media?.cover?.url === 'string'
            ? draftData.media.cover.url
            : '',
          status: 'DRAFT',
          isTiered: pricing.packageModel === 'multi',
          draftData,
          draftVersion: Math.max(clientVersion, 1)
        }
      });

      await syncGigPackages(tx, createdGig.id, draftData);
      await syncGigExtras(tx, createdGig.id, draftData);
      await createGigRevision(tx, createdGig.id, req.user.id, 'CREATED');
      return createdGig;
    });

    return res.status(201).json({
      message: 'Gig draft saved successfully.',
      draft: draftResponse(gig)
    });
  } catch (err) {
    console.error('Create Gig Draft Error:', err);
    return res.status(500).json({ error: 'Failed to create gig draft.' });
  }
};

exports.getGigDraft = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        sellerId: req.user.id,
        status: { in: ['DRAFT', 'PENDING_REVIEW', 'NEEDS_CHANGES'] },
        isDeleted: false
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig draft not found.' });
    }

    return res.json({
      draft: draftResponse(gig)
    });
  } catch (err) {
    console.error('Get Gig Draft Error:', err);
    return res.status(500).json({ error: 'Failed to load gig draft.' });
  }
};

exports.updateGigDraft = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { draftData, draftVersion } = req.body;

    if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
      return res.status(400).json({ error: 'draftData must be a JSON object.' });
    }

    const existingGig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        sellerId: req.user.id,
        status: { in: ['DRAFT', 'NEEDS_CHANGES'] },
        isDeleted: false
      }
    });

    if (!existingGig) {
      return res.status(404).json({ error: 'Gig draft not found.' });
    }

    const clientVersion = normalizeDraftVersion(draftVersion);

    if (clientVersion < existingGig.draftVersion) {
      return res.status(409).json({
        error: 'Stale draft version rejected.',
        draft: draftResponse(existingGig)
      });
    }

    if (clientVersion === existingGig.draftVersion) {
      const sameDraft = areDraftsEqual(
        existingGig.draftData || {},
        draftData
      );

      if (sameDraft) {
        return res.json({
          message: 'Gig draft already saved.',
          draft: draftResponse(existingGig)
        });
      }

      return res.status(409).json({
        error: 'Draft version conflict. Refresh the saved draft before overwriting it.',
        draft: draftResponse(existingGig)
      });
    }

    const { categoryId, subcategoryId } = await resolveDraftTaxonomyIds(
      draftData,
      {
        categoryId: existingGig.categoryId,
        subcategoryId: existingGig.subcategoryId
      }
    );

    const pricing = draftData?.pricing || {};
    const delivery = draftData?.delivery || {};
    const parsedPrice = Number(pricing.basePrice);
    const parsedDays = Number(delivery.deliveryDays);
    const parsedRevisions =
      delivery.revisions === 'unlimited'
        ? -1
        : Number(delivery.revisions);

    const result = await prisma.$transaction(async (tx) => {
      const gigUpdate = await tx.gig.updateMany({
        where: {
          id: gigId,
          sellerId: req.user.id,
          status: { in: ['DRAFT', 'NEEDS_CHANGES'] },
          isDeleted: false,
          draftVersion: existingGig.draftVersion
        },
        data: {
          title: typeof draftData?.basics?.title === 'string'
            ? draftData.basics.title
            : existingGig.title,
          category: typeof draftData?.basics?.categoryId === 'string'
            ? draftData.basics.categoryId
            : existingGig.category,
          categoryId,
          subcategoryId,
          description: typeof draftData.description === 'string'
            ? draftData.description
            : existingGig.description,
          coverImage: typeof draftData?.media?.cover?.url === 'string'
            ? draftData.media.cover.url
            : existingGig.coverImage,
          isTiered: pricing.packageModel === 'multi',
          draftData,
          draftVersion: clientVersion
        }
      });

      if (gigUpdate.count === 1) {
        await syncGigPackages(tx, gigId, draftData);
        await syncGigExtras(tx, gigId, draftData);
      }

      return gigUpdate;
    });

    if (result.count !== 1) {
      const latest = await prisma.gig.findFirst({
        where: {
          id: gigId,
          sellerId: req.user.id,
          status: { in: ['DRAFT', 'NEEDS_CHANGES'] },
          isDeleted: false
        }
      });

      if (!latest) {
        return res.status(404).json({ error: 'Gig draft not found.' });
      }

      return res.status(409).json({
        error: 'Draft was updated by another save request.',
        draft: draftResponse(latest)
      });
    }

    const updatedGig = await prisma.gig.findUnique({
      where: { id: gigId }
    });

    return res.json({
      message: 'Gig draft updated successfully.',
      draft: draftResponse(updatedGig)
    });
  } catch (err) {
    console.error('Update Gig Draft Error:', err);
    return res.status(500).json({ error: 'Failed to update gig draft.' });
  }
};


exports.submitGigDraft = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT_FREELANCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only Student Freelancer accounts can submit gig drafts.'
      });
    }

    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        sellerId: req.user.id,
        status: { in: ['DRAFT', 'NEEDS_CHANGES'] },
        isDeleted: false
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig draft not found.' });
    }

    const blockers = validateGigSubmission(gig.draftData || {});

    if (blockers.length > 0) {
      return res.status(422).json({
        error: 'Gig cannot be submitted until all required blockers are fixed.',
        blockers
      });
    }

    const moderationResult = await moderateGig({
      draftData: gig.draftData || {},
      sellerId: gig.sellerId,
      gigId: gig.id,
      prisma
    });

    const updatedGig = await prisma.$transaction(async (tx) => {
      const submittedGig = await tx.gig.updateMany({
        where: {
          id: gigId,
          sellerId: req.user.id,
          status: { in: ['DRAFT', 'NEEDS_CHANGES'] },
          isDeleted: false,
          draftVersion: gig.draftVersion
        },
        data: {
          status: 'PENDING_REVIEW',
          moderationStatus: moderationResult.status,
          moderationReasonCode: moderationResult.findings[0]?.reasonCode || null,
          moderationFindings: moderationResult
        }
      });

      if (submittedGig.count !== 1) {
        const error = new Error('Gig changed before submission.');
        error.code = 'SUBMISSION_CONFLICT';
        throw error;
      }

      const currentGig = await tx.gig.findUnique({
        where: { id: gigId }
      });

      if (!currentGig) {
        throw new Error('Gig not found after submission.');
      }

      await syncGigPackages(tx, currentGig.id, currentGig.draftData || {});
      await syncGigExtras(tx, currentGig.id, currentGig.draftData || {});

      await createGigRevision(
        tx,
        currentGig.id,
        req.user.id,
        'SUBMITTED_FOR_REVIEW'
      );

      return currentGig;
    });

    return res.json({
      message: 'Gig submitted for review successfully.',
      submission: {
        id: updatedGig.id,
        status: updatedGig.status,
        moderationStatus: updatedGig.moderationStatus,
        moderationReasonCode: updatedGig.moderationReasonCode,
        moderationFindings: updatedGig.moderationFindings || null,
        updatedAt: updatedGig.updatedAt
      }
    });
  } catch (err) {
    if (err?.code === 'SUBMISSION_CONFLICT') {
      return res.status(409).json({
        error: 'The gig changed before submission. Refresh the draft and try again.'
      });
    }

    console.error('Submit Gig Draft Error:', err);
    return res.status(500).json({ error: 'Failed to submit gig for review.' });
  }
};


const assertGigOwner = async (gigId, sellerId) => {
  return prisma.gig.findFirst({
    where: {
      id: gigId,
      sellerId,
      isDeleted: false
    },
    include: {
      packages: {
        orderBy: { price: 'asc' }
      },
      extras: {
        orderBy: { id: 'asc' }
      }
    }
  });
};

exports.getGigRevisions = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        isDeleted: false,
        ...(req.user.role === 'ADMIN' ? {} : { sellerId: req.user.id })
      },
      select: {
        id: true
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const revisions = await prisma.gigRevision.findMany({
      where: { gigId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        actorId: true,
        changeType: true,
        snapshot: true,
        createdAt: true
      }
    });

    return res.json({
      gigId,
      revisions
    });
  } catch (err) {
    console.error('Get Gig Revisions Error:', err);
    return res.status(500).json({ error: 'Failed to load gig revision history.' });
  }
};

exports.getGigForManagement = async (req, res) => {
  try {
    const gig = await assertGigOwner(req.params.gigId, req.user.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    if (!['PUBLISHED', 'PAUSED'].includes(gig.status)) {
      return res.status(409).json({
        error: 'Only published or paused gigs can be managed here.'
      });
    }

    const managementDraftData =
      gig.pendingEditData &&
      typeof gig.pendingEditData === 'object'
        ? {
            ...gig.pendingEditData,
            delivery: {
              ...(gig.pendingEditData.delivery || {}),
              ...getGigAvailability(gig.draftData)
            }
          }
        : gig.draftData || {};

    return res.json({
      id: gig.id,
      status: gig.status,
      title: gig.title,
      category: gig.category,
      categoryId: gig.categoryId,
      subcategoryId: gig.subcategoryId,
      description: gig.description,
      coverImage: gig.coverImage,
      draftData: managementDraftData,
      draftVersion: gig.draftVersion,
      updatedAt: gig.updatedAt,
      packages: gig.packages,
    extras: gig.extras,
      pendingEditVersion: gig.pendingEditVersion,
      pendingEditStatus: gig.pendingEditStatus,
      pendingEditReasonCode: gig.pendingEditReasonCode,
      pendingEditFindings: gig.pendingEditFindings || null,
      pendingEditUpdatedAt: gig.pendingEditUpdatedAt
    });
  } catch (err) {
    console.error('Get Gig Management Error:', err);
    return res.status(500).json({ error: 'Failed to load gig for management.' });
  }
};


exports.submitGigManagementEdit = async (req, res) => {
  try {
    const gigId = req.params.gigId;

    const gig = await assertGigOwner(gigId, req.user.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    if (!['PUBLISHED', 'PAUSED'].includes(gig.status)) {
      return res.status(409).json({
        error: 'Only published or paused gigs can submit edits for review.'
      });
    }

    const pendingEditData =
      gig.pendingEditData &&
      typeof gig.pendingEditData === 'object'
        ? gig.pendingEditData
        : null;

    if (!pendingEditData) {
      return res.status(409).json({
        error: 'No pending gig edits are available for review.'
      });
    }

    const blockers = validateGigSubmission(pendingEditData);

    if (blockers.length > 0) {
      return res.status(422).json({
        error: 'Gig changes cannot be submitted until all required blockers are fixed.',
        blockers
      });
    }

    const moderationResult = await moderateGig({
      draftData: pendingEditData,
      sellerId: gig.sellerId,
      gigId: gig.id,
      prisma
    });

    const { updatedGig, revision } = await prisma.$transaction(async (tx) => {
      const updatedGig = await tx.gig.update({
        where: { id: gig.id },
        data: {
          pendingEditStatus: 'PENDING_REVIEW',
          pendingEditReasonCode:
            moderationResult.findings[0]?.reasonCode || null,
          pendingEditFindings: moderationResult,
          pendingEditModeratedById: null,
          pendingEditModeratedAt: null
        }
      });

      const revision = await createGigPendingEditRevision(
        tx,
        gig.id,
        req.user.id,
        'EDIT_SUBMITTED'
      );

      return { updatedGig, revision };
    });

    await createAuditLog(
      req.user.id,
      'SUBMIT_GIG_EDIT_FOR_REVIEW',
      gig.id,
      `Gig edit submitted for moderation from ${gig.status}.`
    );

    return res.json({
      message: 'Gig changes submitted for review successfully.',
      submission: {
        id: updatedGig.id,
        status: updatedGig.status,
        pendingEditStatus: updatedGig.pendingEditStatus,
        pendingEditVersion: updatedGig.pendingEditVersion,
        pendingEditReasonCode: updatedGig.pendingEditReasonCode,
        pendingEditFindings: updatedGig.pendingEditFindings || null,
        revisionId: revision.id,
        revisionVersion: revision.version,
        updatedAt: updatedGig.updatedAt
      }
    });
  } catch (err) {
    console.error('Submit Gig Management Edit Error:', err);
    return res.status(500).json({
      error: 'Failed to submit gig changes for review.'
    });
  }
};

exports.updateGigAvailability = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { acceptingOrders, unavailableUntil } = req.body || {};

    if (typeof acceptingOrders !== 'boolean') {
      return res.status(400).json({
        error: 'acceptingOrders must be a boolean.'
      });
    }

    const gig = await assertGigOwner(gigId, req.user.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    if (!['PUBLISHED', 'PAUSED'].includes(gig.status)) {
      return res.status(409).json({
        error: 'Only published or paused gigs can update availability.'
      });
    }

    const normalizedUnavailableUntil =
      typeof unavailableUntil === 'string'
        ? unavailableUntil.trim()
        : '';

    const nextDraftData = {
      ...(gig.draftData || {}),
      delivery: {
        ...(gig.draftData?.delivery || {}),
        acceptingOrders,
        unavailableUntil: normalizedUnavailableUntil
      }
    };

    const availabilityError = validateGigAvailability(nextDraftData);

    if (availabilityError) {
      return res.status(422).json({
        error: availabilityError.message,
        field: availabilityError.field,
        detail: availabilityError.detail
      });
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gig.id },
      data: {
        draftData: nextDraftData
      }
    });

    return res.json({
      message: 'Gig availability updated successfully.',
      gig: {
        id: updatedGig.id,
        status: updatedGig.status,
        draftData: updatedGig.draftData || {},
        updatedAt: updatedGig.updatedAt
      }
    });
  } catch (err) {
    console.error('Update Gig Availability Error:', err);
    return res.status(500).json({
      error: 'Failed to update gig availability.'
    });
  }
};

exports.updateGigLifecycle = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { action } = req.body || {};

    const gig = await assertGigOwner(gigId, req.user.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const transitions = {
      pause: { from: ['PUBLISHED'], to: 'PAUSED' },
      resume: { from: ['PAUSED'], to: 'PUBLISHED' },
      archive: { from: ['PUBLISHED', 'PAUSED'], to: 'ARCHIVED' }
    };

    const transition = transitions[action];

    if (!transition) {
      return res.status(400).json({
        error: 'Unsupported gig lifecycle action.'
      });
    }

    if (!transition.from.includes(gig.status)) {
      return res.status(409).json({
        error: `Cannot ${action} a gig in ${gig.status} status.`
      });
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gig.id },
      data: { status: transition.to }
    });

    const actionMessages = {
      pause: 'Gig paused successfully.',
      resume: 'Gig resumed successfully.',
      archive: 'Gig archived successfully.'
    };

    return res.json({
      message: actionMessages[action],
      gig: {
        id: updatedGig.id,
        status: updatedGig.status,
        updatedAt: updatedGig.updatedAt
      }
    });
  } catch (err) {
    console.error('Update Gig Lifecycle Error:', err);
    return res.status(500).json({ error: 'Failed to update gig lifecycle.' });
  }
};

exports.duplicateGig = async (req, res) => {
  try {
    const sourceGig = await assertGigOwner(req.params.gigId, req.user.id);

    if (!sourceGig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    if (!['PUBLISHED', 'PAUSED'].includes(sourceGig.status)) {
      return res.status(409).json({
        error: 'Only published or paused gigs can be duplicated.'
      });
    }

    const duplicated = await prisma.gig.create({
      data: {
        sellerId: req.user.id,
        title: sourceGig.title,
        category: sourceGig.category,
        categoryId: sourceGig.categoryId,
        subcategoryId: sourceGig.subcategoryId,
        description: sourceGig.description,
        coverImage: sourceGig.coverImage,
        isTiered: sourceGig.isTiered,
        status: 'DRAFT',
        draftData: sourceGig.draftData || {},
        draftVersion: Math.max(Number(sourceGig.draftVersion) || 0, 1),
        packages: {
          create: sourceGig.packages.map((pkg) => ({
            tierName: pkg.tierName,
            price: pkg.price,
            deliveryDays: pkg.deliveryDays,
            revisions: pkg.revisions,
            description: pkg.description,
            scope: pkg.scope || null,
            features: pkg.features || null
          }))
        },
        extras: {
          create: sourceGig.extras.map((extra) => ({
            title: extra.title,
            price: extra.price,
            scope: extra.scope || null
          }))
        }
      },
      include: {
        packages: {
          orderBy: { price: 'asc' }
        },
        extras: {
          orderBy: { id: 'asc' }
        }
      }
    });

    return res.status(201).json({
      message: 'Gig duplicated as a draft.',
      gig: {
        id: duplicated.id,
        sellerId: duplicated.sellerId,
        title: duplicated.title,
        category: duplicated.category,
        categoryId: duplicated.categoryId,
        subcategoryId: duplicated.subcategoryId,
        description: duplicated.description,
        coverImage: duplicated.coverImage,
        isTiered: duplicated.isTiered,
        status: duplicated.status,
        draftData: duplicated.draftData || {},
        draftVersion: duplicated.draftVersion,
        updatedAt: duplicated.updatedAt,
        createdAt: duplicated.createdAt,
        packages: duplicated.packages,
        extras: duplicated.extras
      }
    });
  } catch (err) {
    console.error('Duplicate Gig Error:', err);
    return res.status(500).json({ error: 'Failed to duplicate gig.' });
  }
};

exports.updateGigForManagement = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { draftData } = req.body || {};

    if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
      return res.status(400).json({ error: 'draftData must be a JSON object.' });
    }

    const existingGig = await assertGigOwner(gigId, req.user.id);

    if (!existingGig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    if (!['PUBLISHED', 'PAUSED'].includes(existingGig.status)) {
      return res.status(409).json({
        error: 'Only published or paused gigs can be edited.'
      });
    }

    if (existingGig.pendingEditStatus === 'PENDING_REVIEW') {
      return res.status(409).json({
        error: 'This gig already has changes pending moderation.'
      });
    }

    const pendingEditVersion =
      Number(existingGig.pendingEditVersion || 0) + 1;

    const updatedGig = await prisma.gig.update({
      where: { id: existingGig.id },
      data: {
        pendingEditData: draftData,
        pendingEditVersion,
        pendingEditStatus: 'DRAFT',
        pendingEditReasonCode: null,
        pendingEditFindings: null,
        pendingEditModeratedById: null,
        pendingEditModeratedAt: null,
        pendingEditUpdatedAt: new Date()
      }
    });

    return res.json({
      message: 'Gig edit draft saved successfully.',
      gig: {
        id: updatedGig.id,
        status: updatedGig.status,
        pendingEditData: updatedGig.pendingEditData || {},
        pendingEditVersion: updatedGig.pendingEditVersion,
        pendingEditStatus: updatedGig.pendingEditStatus,
        updatedAt: updatedGig.updatedAt
      }
    });
  } catch (err) {
    console.error('Update Gig Management Error:', err);
    return res.status(500).json({ error: 'Failed to save gig edit draft.' });
  }
};

exports.syncGigPackages = syncGigPackages;
exports.syncGigExtras = syncGigExtras;
exports.resolveDraftTaxonomyIds = resolveDraftTaxonomyIds;

exports.getDraftPackagePayload = getDraftPackagePayload;
