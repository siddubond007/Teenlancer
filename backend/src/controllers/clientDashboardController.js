const prisma = require('../config/db');

const ACTIVE_ORDER_STATUSES = [
  'FUNDED_IN_ESCROW',
  'REQUIREMENTS_SUBMITTED',
  'IN_PROGRESS',
  'DELIVERED',
  'REVISION_REQUESTED',
  'IN_REVIEW'
];

const dashboardOrderInclude = {
  seller: {
    select: {
      id: true,
      fullName: true
    }
  },
  job: {
    select: {
      id: true,
      title: true,
      status: true
    }
  },
  deliverables: {
    orderBy: { version: 'desc' },
    take: 1,
    select: {
      id: true,
      version: true,
      reviewStatus: true,
      submittedAt: true
    }
  }
};

exports.getClientDashboard = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'CLIENT') {
      return res.status(403).json({
        error: 'Access denied: client dashboard access required.'
      });
    }

    const clientId = req.user.id;
    const now = new Date();

    const [
      jobStatusGroups,
      proposalGroups,
      activeProjectCount,
      totalSpendAggregate,
      escrowAggregate,
      completedProjects,
      unreadNotifications,
      deliveryApprovalItems,
      paymentItems,
      activeProjects,
      deadlineOrders,
      deadlineProjects,
      recentActivityEvents,
      recentConversationMessages,
      pendingReviewOrders,
      recommendedStudents,
      clientAccount
    ] = await Promise.all([
      prisma.job.groupBy({
        by: ['status'],
        where: {
          clientId,
          isDeleted: false
        },
        _count: { _all: true }
      }),

      prisma.bid.groupBy({
        by: ['jobId'],
        where: {
          job: {
            clientId,
            isDeleted: false
          },
          status: {
            in: ['PENDING', 'SHORTLISTED']
          }
        },
        _count: { _all: true }
      }),

      prisma.job.count({
        where: {
          clientId,
          isDeleted: false,
          status: {
            in: ['IN_PROGRESS', 'PENDING_PAYMENT']
          }
        }
      }),

      prisma.order.aggregate({
        where: {
          clientId,
          status: {
            notIn: ['PENDING_PAYMENT', 'CANCELLED_REFUNDED']
          }
        },
        _sum: { totalAmount: true }
      }),

      prisma.order.aggregate({
        where: {
          clientId,
          status: {
            in: ACTIVE_ORDER_STATUSES
          }
        },
        _sum: { totalAmount: true }
      }),

      prisma.order.count({
        where: {
          clientId,
          status: 'COMPLETED'
        }
      }),

      prisma.notification.count({
        where: {
          userId: clientId,
          isRead: false
        }
      }),

      prisma.order.findMany({
        where: {
          clientId,
          status: 'DELIVERED',
          deliverables: {
            some: {
              reviewStatus: 'PENDING_REVIEW'
            }
          }
        },
        include: dashboardOrderInclude,
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),

      prisma.order.findMany({
        where: {
          clientId,
          status: 'PENDING_PAYMENT'
        },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      prisma.job.findMany({
        where: {
          clientId,
          isDeleted: false,
          status: {
            in: ['IN_PROGRESS', 'PENDING_PAYMENT']
          }
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          budget: true,
          deadlineDate: true,
          timeline: true,
          updatedAt: true,
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 4
      }),

      prisma.order.findMany({
        where: {
          clientId,
          status: {
            in: ACTIVE_ORDER_STATUSES
          },
          deadline: {
            gte: now
          }
        },
        select: {
          id: true,
          status: true,
          deadline: true,
          seller: {
            select: { fullName: true }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { deadline: 'asc' },
        take: 5
      }),

      prisma.job.findMany({
        where: {
          clientId,
          isDeleted: false,
          deadlineDate: {
            gte: now
          },
          status: {
            in: ['OPEN', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          title: true,
          status: true,
          deadlineDate: true
        },
        orderBy: { deadlineDate: 'asc' },
        take: 5
      }),

      prisma.orderActivityEvent.findMany({
        where: {
          order: {
            clientId
          }
        },
        include: {
          order: {
            select: {
              id: true,
              job: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),

      prisma.message.findMany({
        where: {
          orderId: {
            not: null
          },
          order: {
            clientId
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true
            }
          },
          order: {
            select: {
              id: true,
              job: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['orderId'],
        take: 5
      }),

      prisma.order.findMany({
        where: {
          clientId,
          status: 'COMPLETED',
          reviews: {
            none: {
              reviewerId: clientId
            }
          }
        },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true
            }
          },
          client: {
            select: { id: true }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 4
      }),

      prisma.user.findMany({
        where: {
          role: 'STUDENT_FREELANCER',
          isSuspended: false,
          isBanned: false,
          isDeleted: false
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          averageRating: true,
          totalReviews: true,
          profile: {
            select: {
              avatarUrl: true,
              tagline: true,
              category: true,
              hourlyRate: true
            }
          }
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 4
      }),

      prisma.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          verification: {
            select: {
              status: true,
              collegeIdStatus: true,
              govtIdStatus: true,
              idCardUrl: true,
              nationalIdUrl: true
            }
          }
        }
      })
    ]);

    const jobCounts = jobStatusGroups.reduce((acc, row) => {
      acc[String(row.status || '').toUpperCase()] = row._count._all;
      return acc;
    }, {});

    const proposalJobsData = proposalGroups
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 5);

    const proposalJobIds = proposalJobsData.map((row) => row.jobId);

    const proposalJobs = proposalJobIds.length
      ? await prisma.job.findMany({
          where: {
            id: { in: proposalJobIds },
            clientId,
            isDeleted: false
          },
          select: {
            id: true,
            title: true,
            status: true
          }
        })
      : [];

    const proposalCountByJob = new Map(
      proposalJobsData.map((row) => [row.jobId, row._count._all])
    );

    const proposalJobsOrdered = proposalJobs
      .sort(
        (a, b) =>
          (proposalCountByJob.get(b.id) || 0) -
          (proposalCountByJob.get(a.id) || 0)
      )
      .map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        pendingProposalCount: proposalCountByJob.get(job.id) || 0
      }));

    const activeProjectData = activeProjects.map((job) => ({
      id: job.id,
      title: job.title,
      category: job.category,
      status: job.status,
      budget: job.budget,
      deadlineDate: job.deadlineDate,
      timeline: job.timeline,
      proposalCount: job._count.bids,
      updatedAt: job.updatedAt
    }));

    const deliveryItems = deliveryApprovalItems.map((order) => ({
      orderId: order.id,
      projectId: order.job?.id || null,
      projectTitle: order.job?.title || 'Project',
      studentName: order.seller?.fullName || 'Student',
      amount: order.totalAmount,
      deliverableVersion: order.deliverables?.[0]?.version || null,
      submittedAt: order.deliverables?.[0]?.submittedAt || null
    }));

    const paymentActionItems = paymentItems.map((order) => ({
      orderId: order.id,
      projectId: order.job?.id || null,
      projectTitle: order.job?.title || 'Project',
      studentName: order.seller?.fullName || 'Student',
      amount: order.totalAmount,
      createdAt: order.createdAt
    }));

    const deadlines = [
      ...deadlineOrders.map((order) => ({
        orderId: order.id,
        projectId: order.job?.id || null,
        projectTitle: order.job?.title || 'Project',
        studentName: order.seller?.fullName || 'Student',
        status: order.status,
        deadline: order.deadline
      })),
      ...deadlineProjects
        .filter(
          (job) => !deadlineOrders.some((order) => order.job?.id === job.id)
        )
        .map((job) => ({
          orderId: null,
          projectId: job.id,
          projectTitle: job.title,
          studentName: null,
          status: job.status,
          deadline: job.deadlineDate
        }))
    ]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    const recentActivity = recentActivityEvents.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
      orderId: event.order.id,
      projectId: event.order.job?.id || null,
      projectTitle: event.order.job?.title || 'Project'
    }));

    const recentConversations = recentConversationMessages.map((message) => ({
      orderId: message.order.id,
      projectId: message.order.job?.id || null,
      projectTitle: message.order.job?.title || 'Project',
      senderName: message.sender?.fullName || 'Participant',
      message: message.content || 'Attachment',
      createdAt: message.createdAt
    }));

    const pendingReviews = pendingReviewOrders.map((order) => ({
      orderId: order.id,
      projectId: order.job?.id || null,
      projectTitle: order.job?.title || `Order #${order.id.slice(0, 8)}`,
      studentName: order.seller?.fullName || 'Student',
      totalAmount: order.totalAmount
    }));

    return res.json({
      summary: {
        activeProjects: activeProjectCount,
        pendingProposals: proposalGroups.reduce(
          (sum, row) => sum + row._count._all,
          0
        ),
        totalSpend: Number(totalSpendAggregate._sum.totalAmount || 0),
        escrowAmount: Number(escrowAggregate._sum.totalAmount || 0),
        completedProjects,
        unreadNotifications
      },
      projectCounts: {
        all: Object.values(jobCounts).reduce((sum, value) => sum + value, 0),
        drafts: jobCounts.DRAFT || 0,
        published: jobCounts.OPEN || 0,
        inProgress: jobCounts.IN_PROGRESS || 0,
        completed: jobCounts.COMPLETED || 0,
        cancelled: jobCounts.CANCELLED || 0
      },
      attention: {
        proposalJobs: proposalJobsOrdered,
        deliveryApprovalItems: deliveryItems,
        paymentItems: paymentActionItems
      },
      deadlines,
      recentActivity,
      recentConversations,
      pendingReviews,
      recommendedStudents,
      account: {
        id: clientAccount?.id || clientId,
        fullName: clientAccount?.fullName || null,
        email: clientAccount?.email || null,
        phone: clientAccount?.phone || null,
        verification: {
          status: clientAccount?.verification?.status || null,
          govtIdStatus: clientAccount?.verification?.govtIdStatus || null,
          hasGovtId: Boolean(clientAccount?.verification?.nationalIdUrl)
        }
      },
      activeProjects: activeProjectData
    });
  } catch (err) {
    console.error('Client Dashboard Error:', err);
    return res.status(500).json({
      error: 'Failed to load client dashboard.'
    });
  }
};
