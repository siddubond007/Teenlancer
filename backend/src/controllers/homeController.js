const prisma = require('../config/db');

function getCompanyOrProjectName(onboardingData) {
  if (!onboardingData || typeof onboardingData !== 'object' || Array.isArray(onboardingData)) {
    return null;
  }
  return typeof onboardingData.companyOrProjectName === 'string' &&
    onboardingData.companyOrProjectName.trim()
    ? onboardingData.companyOrProjectName.trim()
    : null;
}

function hasProofOfWork(profile) {
  if (!profile) return false;
  return [
    profile.githubUrl,
    profile.youtubeUrl,
    profile.drivePortfolio
  ].some((value) => typeof value === 'string' && value.trim()) ||
    (Array.isArray(profile.portfolioItems) && profile.portfolioItems.length > 0) ||
    (Array.isArray(profile.sampleFiles) && profile.sampleFiles.length > 0);
}

exports.getHomeState = async (req, res) => {
  try {
    if (!req.user || !['STUDENT_FREELANCER', 'CLIENT'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Marketplace Home access is available only to Student or Client accounts.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        role: true,
        isSuspended: true,
        isBanned: true,
        profile: {
          select: {
            avatarUrl: true,
            onboardingCompleted: true,
            onboardingStatus: true,
            onboardingData: true,
            githubUrl: true,
            youtubeUrl: true,
            drivePortfolio: true,
            portfolioItems: true,
            sampleFiles: true
          }
        },
        wallet: { select: { availableBalance: true } },
        verification: { select: { status: true } },
        _count: { select: { gigs: true, bidsPlaced: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user was not found.' });
    }

    let financialSummary = 0;
    let financialLabel = 'Wallet';

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    if (user.role === 'STUDENT_FREELANCER') {
      financialSummary = Math.round(Number(user.wallet?.availableBalance || 0));
    } else {
      financialLabel = 'Escrow';

      // Held transfers are the current authoritative escrow state until release.
      // Do not alter payment lifecycle rules for Home.
      const escrowAggregate = await prisma.transfer.aggregate({
        where: {
          onHold: true,
          status: { not: 'RELEASED' },
          order: { clientId: user.id }
        },
        _sum: { amount: true }
      });

      financialSummary = Math.round(Number(escrowAggregate._sum.amount || 0));
    }

    const onboardingData =
      user.profile?.onboardingData &&
      typeof user.profile.onboardingData === 'object' &&
      !Array.isArray(user.profile.onboardingData)
        ? user.profile.onboardingData
        : {};

    const profileComplete =
      user.profile?.onboardingCompleted === true &&
      user.profile?.onboardingStatus === 'COMPLETED';

    const activeOrderStatuses = [
      'FUNDED_IN_ESCROW',
      'REQUIREMENTS_SUBMITTED',
      'IN_PROGRESS',
      'DELIVERED',
      'REVISION_REQUESTED',
      'IN_REVIEW',
      'DISPUTED'
    ];

    const activeOrder = await prisma.order.findFirst({
      where: user.role === 'STUDENT_FREELANCER'
        ? {
            sellerId: user.id,
            status: { in: activeOrderStatuses }
          }
        : {
            clientId: user.id,
            status: { in: activeOrderStatuses }
          },
      include: {
        client: {
          select: {
            id: true,
            fullName: true
          }
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                avatarUrl: true
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        },
        gig: {
          select: {
            id: true,
            title: true
          }
        },
        transfer: {
          select: {
            onHold: true,
            status: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const getWorkflowProgress = (status) => {
      switch (status) {
        case 'FUNDED_IN_ESCROW':
          return 20;
        case 'REQUIREMENTS_SUBMITTED':
          return 35;
        case 'IN_PROGRESS':
          return 60;
        case 'REVISION_REQUESTED':
          return 70;
        case 'DELIVERED':
          return 85;
        case 'IN_REVIEW':
          return 90;
        case 'DISPUTED':
          return 50;
        default:
          return 0;
      }
    };

    const activeWorkspace = activeOrder
      ? {
          id: activeOrder.id,
          title:
            user.role === 'CLIENT'
              ? activeOrder.gig?.title ||
                activeOrder.job?.title ||
                'Active project'
              : activeOrder.job?.title ||
                activeOrder.gig?.title ||
                'Active project',
          counterpartName:
            user.role === 'STUDENT_FREELANCER'
              ? activeOrder.client?.fullName || 'Client'
              : activeOrder.seller?.fullName || 'Student freelancer',
          counterpartAvatarUrl:
            user.role === 'CLIENT'
              ? activeOrder.seller?.profile?.avatarUrl || null
              : null,
          status: activeOrder.status,
          escrowStatus:
            activeOrder.transfer?.onHold === true
              ? 'Funded'
              : activeOrder.status === 'FUNDED_IN_ESCROW'
                ? 'Funded'
                : null,
          deadline: activeOrder.deadline,
          progressPercent: getWorkflowProgress(activeOrder.status)
        }
      : null;

    const studentSkills = Array.isArray(onboardingData.selectedSkills)
      ? onboardingData.selectedSkills.filter(
          (value) => typeof value === 'string' && value.trim()
        ).slice(0, 6)
      : [];
    const studentDomain =
      typeof onboardingData.primaryDomain === 'string' &&
      onboardingData.primaryDomain.trim()
        ? onboardingData.primaryDomain.trim()
        : null;

    const studentRecommendationWhere = {
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
      ...(studentSkills.length || studentDomain
        ? {
            OR: [
              ...(studentSkills.length
                ? [{ skills: { hasSome: studentSkills } }]
                : []),
              ...(studentDomain
                ? [{ category: { contains: studentDomain, mode: 'insensitive' } }]
                : [])
            ]
          }
        : {})
    };

    let recommendedJobs = [];
    if (user.role === 'STUDENT_FREELANCER') {
      recommendedJobs = await prisma.job.findMany({
        where: studentRecommendationWhere,
        select: {
          id: true,
          title: true,
          budget: true,
          fixedBudget: true,
          minimumBudget: true,
          maximumBudget: true,
          budgetType: true,
          skills: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 2
      });

      // Keep the Home section useful when no current listing matches the student's
      // onboarding signals, without inventing or fabricating marketplace data.
      if (recommendedJobs.length === 0 && (studentSkills.length || studentDomain)) {
        recommendedJobs = await prisma.job.findMany({
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
            isDeleted: false
          },
          select: {
            id: true,
            title: true,
            budget: true,
            fixedBudget: true,
            minimumBudget: true,
            maximumBudget: true,
            budgetType: true,
            skills: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 2
        });
      }
    }

    const discoveryCategory =
      user.role === 'CLIENT'
        ? (
            Array.isArray(onboardingData.hiringCategories)
              ? onboardingData.hiringCategories.find(
                  (value) => typeof value === 'string' && value.trim()
                )
              : null
          ) || 'Design'
        : null;

    const topVerifiedGigs = user.role === 'CLIENT'
      ? await prisma.gig.findMany({
          where: {
            status: 'PUBLISHED',
            isDeleted: false,
            category: { equals: discoveryCategory, mode: 'insensitive' },
            seller: {
              isBanned: false,
              isSuspended: false,
              verification: { status: 'APPROVED' }
            }
          },
          select: {
            id: true,
            title: true,
            coverImage: true,
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
        })
      : [];

    const formatBudgetLabel = (job) => {
      const fixed = Number(job.fixedBudget);
      const minimum = Number(job.minimumBudget);
      const maximum = Number(job.maximumBudget);
      const budget = Number(job.budget);

      if (Number.isFinite(fixed) && fixed > 0) {
        return `₹${Math.round(fixed)}`;
      }

      if (
        Number.isFinite(minimum) &&
        minimum > 0 &&
        Number.isFinite(maximum) &&
        maximum > 0
      ) {
        return `₹${Math.round(minimum)}–₹${Math.round(maximum)}`;
      }

      if (Number.isFinite(budget) && budget > 0) {
        return `₹${Math.round(budget)}`;
      }

      return 'Budget on request';
    };

    const recommendedJobCards = recommendedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      budgetLabel: formatBudgetLabel(job),
      skills: Array.isArray(job.skills) ? job.skills.filter(Boolean).slice(0, 3) : [],
      createdAt: job.createdAt
    }));

    const topVerifiedGigCards = topVerifiedGigs.map((gig) => ({
      id: gig.id,
      title: gig.title,
      sellerName: gig.seller?.fullName || 'Verified student',
      sellerAvatarUrl: gig.seller?.profile?.avatarUrl || null,
      rating: Number(gig.seller?.averageRating || 0),
      startingPrice: Math.round(Number(gig.packages?.[0]?.price || 0)),
      coverImage: gig.coverImage || null
    }));

    return res.json({
      id: user.id,
      firstName: user.firstName,
      role: user.role,
      avatarUrl: user.profile?.avatarUrl || null,
      financialSummary,
      financialLabel,
      companyOrProjectName:
        user.role === 'CLIENT' ? getCompanyOrProjectName(onboardingData) : null,
      verificationApproved:
        user.role === 'STUDENT_FREELANCER' &&
        user.verification?.status === 'APPROVED',
      profileComplete,
      proofOfWorkComplete: hasProofOfWork(user.profile),
      hasGig: user._count.gigs > 0,
      hasProposal: user._count.bidsPlaced > 0,
      activeWorkspace,
      recommendedJobs: recommendedJobCards,
      discoveryCategory,
      topVerifiedGigs: topVerifiedGigCards,
      unreadNotifications,
      isSuspended: Boolean(user.isSuspended),
      isBanned: Boolean(user.isBanned)
    });
  } catch (error) {
    console.error('Home State Error:', error);
    return res.status(500).json({ error: 'Failed to load your Home state.' });
  }
};
