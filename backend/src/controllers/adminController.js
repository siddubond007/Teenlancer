const prisma = require('../config/db');
const {
  syncGigPackages,
  syncGigExtras,
  resolveDraftTaxonomyIds,
  getDraftPackagePayload
} = require('./gigController');
const { createGigRevision } = require('../services/gigRevisionService');
const { getGigAvailability } = require('../services/gigAvailabilityService');

async function recalculateUserReputation(userId) {
  const reviewStats = await prisma.review.aggregate({
    where: {
      revieweeId: userId,
      isVisible: true
    },
    _avg: {
      overallRating: true,
      communicationRating: true,
      qualityRating: true,
      timelinessRating: true
    },
    _count: {
      id: true
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: Number(reviewStats._avg.overallRating || 0),
      communicationAvg: Number(reviewStats._avg.communicationRating || 0),
      qualityAvg: Number(reviewStats._avg.qualityRating || 0),
      timelinessAvg: Number(reviewStats._avg.timelinessRating || 0),
      totalReviews: reviewStats._count.id
    }
  });
}

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
    console.error("Audit Log Error:", err.message);
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        wallet: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Admin retrieved ${users.length} users successfully.`);
    res.json(users);
  } catch (err) {
    console.error("Admin getAllUsers Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      studentCount,
      clientCount,
      suspendedUsers,
      totalJobs,
      openJobs,
      totalOrders,
      completedOrders,
      disputedOrders,
      pendingVerifications,
      approvedVerifications,
      moderationLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT_FREELANCER' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.job.count(),
      prisma.job.count({ where: { isOpen: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'DISPUTED' } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.verificationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.moderationLog.count()
    ]);

    const reputationStats = await prisma.user.aggregate({
      _sum: { points: true },
      _avg: { averageRating: true }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const adminActionsToday = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: startOfToday
        }
      }
    });

    const failedAdminLogins = await prisma.adminLoginLog.count({
      where: {
        loginStatus: {
          startsWith: 'FAILED'
        }
      }
    });

    const activeAdmins = await prisma.auditLog.groupBy({
      by: ['adminId']
    });

    const mostActiveAdminData = await prisma.auditLog.groupBy({
      by: ['adminId'],
      _count: {
        adminId: true
      },
      orderBy: {
        _count: {
          adminId: 'desc'
        }
      },
      take: 1
    });

    const stats = {
      totalUsers,
      studentCount,
      clientCount,
      suspendedUsers,
      totalJobs,
      openJobs,
      totalOrders,
      completedOrders,
      disputedOrders,
      pendingVerifications,
      approvedVerifications,
      moderationLogs,
      adminActionsToday,
      failedAdminLogins,
      activeAdmins: activeAdmins.length,
      mostActiveAdmin: mostActiveAdminData[0]?.adminId || null,
      totalReputationPoints: reputationStats._sum.points || 0,
      averagePlatformRating: Number(
        reputationStats._avg.averageRating || 0
      ).toFixed(2)
    };

    res.json(stats);
  } catch (err) {
    console.error("Admin getStats Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
      await createAuditLog(req.user.id, "DELETE_USER", userId, "Admin deleted user account");

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete: ' + err.message });
  }
};

exports.toggleSuspend = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: !user.isSuspended }
    });

    await createAuditLog(
      req.user.id,
      updated.isSuspended ? "SUSPEND_USER" : "UNSUSPEND_USER",
      userId,
      updated.isSuspended ? "User suspended" : "User unsuspended"
    );


    res.json({ message: `User status changed to ${updated.isSuspended ? 'SUSPENDED' : 'ACTIVE'}.`, isSuspended: updated.isSuspended });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    await createAuditLog(
      req.user.id,
      "CHANGE_ROLE",
      userId,
      `Role changed to ${role}`
    );

    res.json({
      message: `User role changed to ${role}.`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getModerationLogs = async (req, res) => {
  try {
    const logs = await prisma.moderationLog.findMany({
      include: { sender: { select: { fullName: true, email: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getVerifications = async (req, res) => {
  try {
    const verifications = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            age: true,
            role: true,
            createdAt: true,
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(verifications);
  } catch (err) {
    console.error('getVerifications error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, reason } = req.body;
    
    const dataToUpdate = {
      reviewedAt: new Date()
    };

    if (type === 'COLLEGE') {
      dataToUpdate.collegeIdStatus = status;
      dataToUpdate.collegeRejectionReason = status === 'REJECTED' ? (reason || 'College ID document was unreadable or rejected.') : null;
    } else if (type === 'GOVT') {
      dataToUpdate.govtIdStatus = status;
      dataToUpdate.govtRejectionReason = status === 'REJECTED' ? (reason || 'Government ID document was unreadable or rejected.') : null;
    } else {
      dataToUpdate.status = status;
      dataToUpdate.collegeIdStatus = status;
      dataToUpdate.govtIdStatus = status;
    }

    const verification = await prisma.verificationRequest.update({
      where: { id },
      data: dataToUpdate
    });

      await createAuditLog(
        req.user.id,
        status === "APPROVED" ? "APPROVE_VERIFICATION" : "REJECT_VERIFICATION",
        verification.userId,
        `${type || "ALL"} verification ${status}`
      );


    await prisma.notification.create({
      data: {
        userId: verification.userId,
        title: status === 'APPROVED'
          ? 'Verification Approved'
          : 'Verification Update',
        message: status === 'APPROVED'
          ? 'Your student verification has been approved. Your profile now displays verified status.'
          : `Verification status changed to ${status}.`,
        type: 'VERIFICATION_STATUS'
      }
    });
    
    res.json({ message: `Verification for ${type || 'All'} updated to ${status}`, verification });
  } catch (err) {
    console.error('updateVerificationStatus error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPayoutRequests = async (req, res) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approvePayoutRequest = async (req, res) => {
  try {
    const { payoutId } = req.params;

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout request not found.' });
    }

    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      }),
      prisma.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: {
            decrement: payout.amount
          }
        }
      })
    ]);


      await createAuditLog(
        req.user.id,
        "APPROVE_PAYOUT",
        payout.userId,
        `Approved payout of ${payout.amount}`
      );

    res.json({ message: 'Payout approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectPayoutRequest = async (req, res) => {
  try {
    const { payoutId } = req.params;

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout request not found.' });
    }

    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'REJECTED',
          processedAt: new Date()
        }
      }),
      prisma.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: {
            decrement: payout.amount
          },
          availableBalance: {
            increment: payout.amount
          }
        }
      })
    ]);


      await createAuditLog(
        req.user.id,
        "REJECT_PAYOUT",
        payout.userId,
        `Rejected payout of ${payout.amount}`
      );

    res.json({ message: 'Payout rejected and funds returned to wallet.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        reviewer: { select: { fullName: true } },
        reviewee: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.hideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isVisible: false,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: reason || 'Hidden by admin'
      }
    });

    await recalculateUserReputation(review.revieweeId);


      await createAuditLog(
        req.user.id,
        "HIDE_REVIEW",
        review.revieweeId,
        reason || "Review hidden by admin"
      );

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.showReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isVisible: true,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: 'Review restored by admin'
      }
    });

    await recalculateUserReputation(review.revieweeId);


      await createAuditLog(
        req.user.id,
        "SHOW_REVIEW",
        review.revieweeId,
        "Review restored by admin"
      );

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isFlagged: true,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: reason || 'Flagged by admin'
      }
    });

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    await prisma.review.delete({
      where: { id: reviewId }
    });

    if (review) {
      await recalculateUserReputation(review.revieweeId);
    }

      await createAuditLog(
        req.user.id,
        "DELETE_REVIEW",
        review?.revieweeId,
        "Review permanently deleted by admin"
      );


    res.json({ message: 'Review deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getFraudDashboard = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const disputes = await prisma.dispute.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        order: true
      }
    });

    const grouped = {};

    disputes.forEach((dispute) => {
      const userId = dispute.openedById;

      if (!grouped[userId]) {
        grouped[userId] = {
          disputes: 0,
          sellers: new Set()
        };
      }

      grouped[userId].disputes += 1;

      if (dispute.order?.sellerId) {
        grouped[userId].sellers.add(dispute.order.sellerId);
      }
    });

    const flaggedUsers = [];
    const flaggedUserDetails = [];

    for (const userId of Object.keys(grouped)) {
      const stats = grouped[userId];

      const totalOrders = await prisma.order.count({
        where: {
          OR: [
            { clientId: userId },
            { sellerId: userId }
          ]
        }
      });

      const disputeRate =
        totalOrders > 0
          ? (stats.disputes / totalOrders) * 100
          : 0;

      const isSuspicious =
        stats.disputes >= 5 ||
        disputeRate > 50 ||
        stats.sellers.size >= 3;

      if (isSuspicious) {
        flaggedUsers.push(userId);

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
            reviewsWritten: {
              select: { id: true }
            },
            ordersAsClient: {
              select: { id: true }
            },
            ordersAsSeller: {
              select: { id: true }
            }
          }
        });

        if (user) {
          const accountAgeHours =
            (Date.now() - new Date(user.createdAt).getTime()) /
            (1000 * 60 * 60);

          user.accountAgeHours = Math.floor(accountAgeHours);

          const totalOrdersForUser =
            user.ordersAsClient.length +
            user.ordersAsSeller.length;

          const suspiciousAccount =
            accountAgeHours < 24 &&
            (
              user.reviewsWritten.length >= 10 ||
              totalOrdersForUser >= 20
            );

          user.suspiciousAccount = suspiciousAccount;

          flaggedUserDetails.push(user);
        }
      }
    }

    const reviews = await prisma.review.findMany({
      select: {
        reviewerId: true,
        revieweeId: true,
        overallRating: true
      }
    });

    let suspiciousReviews = 0;
    const reviewerStats = {};

    for (const review of reviews) {
      if (!reviewerStats[review.reviewerId]) {
        reviewerStats[review.reviewerId] = {
          total: 0,
          fiveStars: 0,
          oneStars: 0,
          targets: new Set()
        };
      }

      reviewerStats[review.reviewerId].total += 1;
      reviewerStats[review.reviewerId].targets.add(review.revieweeId);

      if (review.overallRating === 5) {
        reviewerStats[review.reviewerId].fiveStars += 1;
      }

      if (review.overallRating === 1) {
        reviewerStats[review.reviewerId].oneStars += 1;
      }
    }

    for (const reviewerId of Object.keys(reviewerStats)) {
      const stats = reviewerStats[reviewerId];

      const excessiveFiveStar =
        stats.total >= 5 &&
        stats.fiveStars / stats.total >= 0.9;

      const excessiveOneStar =
        stats.total >= 5 &&
        stats.oneStars / stats.total >= 0.9;

      const reviewFarmPattern =
        stats.targets.size >= 10;

      if (
        excessiveFiveStar ||
        excessiveOneStar ||
        reviewFarmPattern
      ) {
        suspiciousReviews += 1;
      }
    }

    const verificationRecords = await prisma.verificationRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      });

    let verificationAbuseCases = 0;
    const verificationAbuseUsers = [];

    for (const verification of verificationRecords) {
      const rejectedCount =
        (verification.status === 'REJECTED' ? 1 : 0) +
        (verification.collegeIdStatus === 'REJECTED' ? 1 : 0) +
        (verification.govtIdStatus === 'REJECTED' ? 1 : 0);

      if (rejectedCount >= 2) {
        verificationAbuseCases += 1;

        if (verification.user) {
          verificationAbuseUsers.push({
            ...verification.user,
            rejectedCount
          });
        }
      }
    }

    const totalFraudSignals =
      flaggedUsers.length +
      suspiciousReviews +
      verificationAbuseCases;

    let riskScore = 0;

    if (flaggedUsers.length > 0) {
      riskScore += 25;
    }

    if (suspiciousReviews > 0) {
      riskScore += 30;
    }

    if (verificationAbuseCases > 0) {
      riskScore += 25;
    }

    const suspiciousAccountCount =
      flaggedUserDetails.filter(
        user => user.suspiciousAccount
      ).length;

    if (suspiciousAccountCount > 0) {
      riskScore += 20;
    }

    let riskLevel = 'LOW';

    if (riskScore >= 81) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 51) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 21) {
      riskLevel = 'MEDIUM';
    }

    res.json({
      suspiciousAccounts: flaggedUsers.length,
      highRiskUsers: flaggedUsers.length,
      reviewAbuseCases: suspiciousReviews,
      verificationAbuseCases,
      verificationAbuseUsers,
      disputeAbuseCases: flaggedUsers.length,
      flaggedUsers: flaggedUserDetails,
      totalFraudSignals,
      riskScore,
      riskLevel
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getFraudInvestigationReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verification: true,
        reviewsWritten: true,
        reviewsReceived: true,
        ordersAsClient: true,
        ordersAsSeller: true,
        disputesOpened: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const moderationLogs = await prisma.moderationLog.findMany({
      where: {
        senderId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const accountAgeHours = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) /
      (1000 * 60 * 60)
    );

    const totalOrders =
      user.ordersAsClient.length +
      user.ordersAsSeller.length;

    const totalReviews =
      user.reviewsWritten.length +
      user.reviewsReceived.length;

    const totalDisputes =
      user.disputesOpened.length;

    const verificationRejections =
      (user.verification?.status === 'REJECTED' ? 1 : 0) +
      (user.verification?.collegeIdStatus === 'REJECTED' ? 1 : 0) +
      (user.verification?.govtIdStatus === 'REJECTED' ? 1 : 0);

    const riskFactors = [];

    if (accountAgeHours < 24) {
      riskFactors.push('Very New Account');
    }

    if (totalDisputes >= 5) {
      riskFactors.push('Excessive Disputes');
    }

    if (verificationRejections >= 2) {
      riskFactors.push('Verification Abuse');
    }

    if (totalReviews >= 10 && accountAgeHours < 24) {
      riskFactors.push('Review Burst Activity');
    }

    let fraudScore = 0;
    const scoreBreakdown = [];

    if (accountAgeHours < 24) {
      fraudScore += 20;
      scoreBreakdown.push('Very New Account (+20)');
    }

    if (totalDisputes >= 5) {
      fraudScore += 20;
      scoreBreakdown.push('Excessive Disputes (+20)');
    }

    if (verificationRejections >= 2) {
      fraudScore += 20;
      scoreBreakdown.push('Verification Abuse (+20)');
    }

    if (totalReviews >= 10 && accountAgeHours < 24) {
      console.log(
        '[FRAUD]',
        user.email,
        'Review Burst Triggered',
        {
          totalReviews,
          accountAgeHours
        }
      );

      fraudScore += 25;
      scoreBreakdown.push('Review Burst Activity (+25)');
    }

    if (moderationLogs.length > 0) {
      fraudScore += 15;
      scoreBreakdown.push('Moderation Violations (+15)');
    }

    let riskLevel = 'LOW';

    if (fraudScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (fraudScore >= 60) {
      riskLevel = 'HIGH';
    } else if (fraudScore >= 30) {
      riskLevel = 'MEDIUM';
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      profile: user.profile,
      orders: {
        asClient: user.ordersAsClient,
        asSeller: user.ordersAsSeller,
        total: totalOrders
      },
      reviews: {
        written: user.reviewsWritten,
        received: user.reviewsReceived,
        total: totalReviews
      },
      disputes: user.disputesOpened,
      moderationLogs,
      verification: user.verification,
      riskFactors,
      fraudScore,
      scoreBreakdown,
      riskLevel,
      accountAgeHours
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};



exports.addInvestigationNote = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    const action = await prisma.investigationAction.create({
      data: {
        userId,
        adminId: req.user.id,
        actionType: 'NOTE',
        note: note || ''
      }
    });

      await createAuditLog(
        req.user.id,
        "INVESTIGATION_NOTE",
        userId,
        note || "Investigation note added"
      );


    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvestigationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await prisma.investigationAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date()
      }
    });

    await prisma.investigationAction.create({
      data: {
        userId,
        adminId: req.user.id,
        actionType: 'BAN'
      }
    });

      await createAuditLog(
        req.user.id,
        "BAN_USER",
        userId,
        "User banned through fraud investigation"
      );


    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearInvestigation = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.investigationAction.create({
      data: {
        userId,
        adminId: req.user.id,
        actionType: 'CLEAR'
      }
    });

      await createAuditLog(
        req.user.id,
        "CLEAR_INVESTIGATION",
        userId,
        "Investigation manually cleared"
      );


    res.json({ message: 'Investigation cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGigModerationStatus = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { status, reasonCode, reason } = req.body || {};

    const allowedStatuses = new Set([
      'PUBLISHED',
      'NEEDS_CHANGES',
      'REJECTED'
    ]);

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({
        error: 'Moderation status must be PUBLISHED, NEEDS_CHANGES, or REJECTED.'
      });
    }

    const normalizedReasonCode =
      typeof reasonCode === 'string' ? reasonCode.trim() : '';

    const normalizedReason =
      typeof reason === 'string' ? reason.trim() : '';

    if (
      ['NEEDS_CHANGES', 'REJECTED'].includes(status) &&
      !normalizedReasonCode
    ) {
      return res.status(400).json({
        error: 'A moderation reason code is required for this decision.'
      });
    }

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        isDeleted: false,
        OR: [
          { status: 'PENDING_REVIEW' },
          { pendingEditStatus: 'PENDING_REVIEW' }
        ]
      },
      select: {
        id: true,
        sellerId: true,
        title: true,
        category: true,
        categoryId: true,
        subcategoryId: true,
        description: true,
        coverImage: true,
        isTiered: true,
        status: true,
        draftData: true,
        pendingEditData: true,
        pendingEditVersion: true,
        pendingEditStatus: true,
        moderationFindings: true
      }
    });

    if (!gig) {
      return res.status(404).json({
        error: 'Pending gig moderation item not found.'
      });
    }

    const isPendingEdit = gig.pendingEditStatus === 'PENDING_REVIEW';
    const now = new Date();

    const updatedGig = await prisma.$transaction(async (tx) => {
      if (!isPendingEdit) {
        return tx.gig.update({
          where: { id: gig.id },
          data: {
            status,
            moderationStatus: 'REVIEWED',
            moderationReasonCode: normalizedReasonCode || null,
            moderatedById: req.user.id,
            moderatedAt: now,
            moderationFindings: gig.moderationFindings || null
          }
        });
      }

      if (status !== 'PUBLISHED') {
        return tx.gig.update({
          where: { id: gig.id },
          data: {
            pendingEditStatus: status === 'NEEDS_CHANGES'
              ? 'NEEDS_CHANGES'
              : 'REJECTED',
            pendingEditReasonCode: normalizedReasonCode || null,
            pendingEditModeratedById: req.user.id,
            pendingEditModeratedAt: now
          }
        });
      }

      const pendingEdit = gig.pendingEditData;

      if (!pendingEdit || typeof pendingEdit !== 'object') {
        throw new Error('Pending gig edit data is missing.');
      }

      const liveAvailability = getGigAvailability(gig.draftData);
      const promotedDraftData = {
        ...pendingEdit,
        delivery: {
          ...(pendingEdit.delivery || {}),
          ...liveAvailability
        }
      };

      const { categoryId, subcategoryId } =
        await resolveDraftTaxonomyIds(pendingEdit, {
          categoryId: gig.categoryId,
          subcategoryId: gig.subcategoryId
        });

      const title =
        typeof pendingEdit?.basics?.title === 'string'
          ? pendingEdit.basics.title
          : gig.title;

      const category =
        typeof pendingEdit?.basics?.categoryId === 'string'
          ? pendingEdit.basics.categoryId
          : gig.category;

      const description =
        typeof pendingEdit.description === 'string'
          ? pendingEdit.description
          : gig.description;

      const coverImage =
        typeof pendingEdit?.media?.cover?.url === 'string'
          ? pendingEdit.media.cover.url
          : gig.coverImage;

      const isTiered =
        pendingEdit?.pricing?.packageModel === 'multi';

      const promotedGig = await tx.gig.update({
        where: { id: gig.id },
        data: {
          title,
          category,
          categoryId,
          subcategoryId,
          description,
          coverImage,
          isTiered,
          draftData: promotedDraftData,
          draftVersion: Math.max(
            Number(gig.pendingEditVersion) || 0,
            1
          ),
          moderationStatus: 'REVIEWED',
          moderationReasonCode: null,
          moderatedById: req.user.id,
          moderatedAt: now,
          moderationFindings: gig.moderationFindings || null,

          pendingEditData: null,
          pendingEditStatus: null,
          pendingEditReasonCode: null,
          pendingEditFindings: null,
          pendingEditModeratedById: null,
          pendingEditModeratedAt: null,
          pendingEditUpdatedAt: null
        }
      });

      await syncGigPackages(tx, gig.id, pendingEdit);
      await syncGigExtras(tx, gig.id, pendingEdit);

      await createGigRevision(
        tx,
        gig.id,
        req.user.id,
        'EDIT_APPROVED'
      );

      return promotedGig;
    });

    const auditAction =
      status === 'PUBLISHED'
        ? (isPendingEdit ? 'APPROVE_GIG_EDIT' : 'APPROVE_GIG_MODERATION')
        : status === 'NEEDS_CHANGES'
          ? (isPendingEdit ? 'REQUEST_GIG_EDIT_CHANGES' : 'REQUEST_GIG_CHANGES')
          : (isPendingEdit ? 'REJECT_GIG_EDIT' : 'REJECT_GIG_MODERATION');

    const auditDetails = [
      `Gig "${gig.title}" moderation decision: ${status}`,
      isPendingEdit ? 'Pending published edit' : 'Initial publication review',
      normalizedReasonCode ? `Reason code: ${normalizedReasonCode}` : null,
      normalizedReason ? `Reason: ${normalizedReason}` : null
    ].filter(Boolean).join(' | ');

    await createAuditLog(
      req.user.id,
      auditAction,
      gig.id,
      auditDetails
    );

    const notificationTitle =
      status === 'PUBLISHED'
        ? (isPendingEdit ? 'Gig Changes Approved' : 'Gig Approved')
        : status === 'NEEDS_CHANGES'
          ? (isPendingEdit ? 'Gig Changes Need Updates' : 'Gig Needs Changes')
          : (isPendingEdit ? 'Gig Changes Rejected' : 'Gig Rejected');

    const notificationMessage =
      status === 'PUBLISHED'
        ? (isPendingEdit
            ? `Your changes to gig "${gig.title}" have been approved and are now live.`
            : `Your gig "${gig.title}" has been approved and is now published.`)
        : status === 'NEEDS_CHANGES'
          ? `Your changes to gig "${gig.title}" need updates before they can go live. Reason code: ${normalizedReasonCode}.${normalizedReason ? ` ${normalizedReason}` : ''}`
          : `Your changes to gig "${gig.title}" were rejected during moderation. Reason code: ${normalizedReasonCode}.${normalizedReason ? ` ${normalizedReason}` : ''}`;

    await prisma.notification.create({
      data: {
        userId: gig.sellerId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'GIG_MODERATION'
      }
    });

    return res.json({
      message: `Gig moderation updated to ${status}.`,
      gig: updatedGig
    });
  } catch (err) {
    console.error('Update Gig Moderation Status Error:', err);
    return res.status(500).json({
      error: 'Failed to update gig moderation status.'
    });
  }
};

exports.getGigModerationQueue = async (req, res) => {
  try {
    const gigs = await prisma.gig.findMany({
      where: {
        isDeleted: false,
        OR: [
          { status: 'PENDING_REVIEW' },
          { pendingEditStatus: 'PENDING_REVIEW' }
        ]
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true,
            slug: true,
            isRestricted: true
          }
        },
        subcategoryRef: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        packages: {
          orderBy: { price: 'asc' }
        }
      },
      orderBy: { updatedAt: 'asc' }
    });

    return res.json(
      gigs.map((gig) => {
        const isPendingEdit = gig.pendingEditStatus === 'PENDING_REVIEW';

        if (!isPendingEdit) {
          const activePackageNames = gig.isTiered
            ? new Set(['Basic', 'Standard', 'Premium'])
            : new Set(['Single']);

          return {
            ...gig,
            packages: gig.packages.filter((pkg) =>
              activePackageNames.has(pkg.tierName)
            )
          };
        }

        const pending = gig.pendingEditData || {};
        const pendingPackages = getDraftPackagePayload(pending);

        return {
          ...gig,
          isPendingEdit: true,
          draftData: pending,
          title: pending?.basics?.title || gig.title,
          category: pending?.basics?.categoryId || gig.category,
          description:
            typeof pending.description === 'string'
              ? pending.description
              : gig.description,
          coverImage:
            typeof pending?.media?.cover?.url === 'string'
              ? pending.media.cover.url
              : gig.coverImage,
          isTiered: pending?.pricing?.packageModel === 'multi',
          packages: pendingPackages
        };
      })
    );
  } catch (err) {
    console.error('Get Gig Moderation Queue Error:', err);
    return res.status(500).json({ error: 'Failed to load gig moderation queue.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 200
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    });

    const csvRows = [
      'Timestamp,Admin ID,Action Type,Target ID,Details'
    ];

    logs.forEach(log => {
      csvRows.push(
        [
          new Date(log.createdAt).toISOString(),
          log.adminId || '',
          log.actionType || '',
          log.targetId || '',
          `"${(log.details || '').replace(/"/g, '""')}"`
        ].join(',')
      );
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit-logs.csv"'
    );

    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

