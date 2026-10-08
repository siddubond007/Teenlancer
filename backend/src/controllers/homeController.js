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
            activeOrder.job?.title ||
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
      isSuspended: Boolean(user.isSuspended),
      isBanned: Boolean(user.isBanned)
    });
  } catch (error) {
    console.error('Home State Error:', error);
    return res.status(500).json({ error: 'Failed to load your Home state.' });
  }
};
