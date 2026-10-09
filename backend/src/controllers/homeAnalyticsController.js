const prisma = require('../config/db');

const ANALYTICS_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function emptyMetrics() {
  return {
    impressions: 0,
    views: 0,
    clicks: 0,
    orders: 0,
    conversionRate: 0
  };
}

function calculateConversionRate(orders, impressions) {
  if (impressions <= 0) return 0;
  return Number(((orders / impressions) * 100).toFixed(2));
}

/**
 * Returns rolling seven-day marketplace analytics for the authenticated student's
 * currently published gigs. All counts come from persisted analytics events/orders.
 */
exports.getHomeAnalytics = async (req, res) => {
  try {
    if (req.user?.role !== 'STUDENT_FREELANCER') {
      return res.status(403).json({
        error: 'Marketplace analytics are available only to Student Freelancer accounts.'
      });
    }

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - ANALYTICS_WINDOW_DAYS * DAY_IN_MS);

    const gigs = await prisma.gig.findMany({
      where: {
        sellerId: req.user.id,
        status: 'PUBLISHED',
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (gigs.length === 0) {
      return res.json({
        periodDays: ANALYTICS_WINDOW_DAYS,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        publishedGigCount: 0,
        totals: emptyMetrics(),
        gigs: []
      });
    }

    const gigIds = gigs.map((gig) => gig.id);
    const eventWhere = {
      gigId: { in: gigIds },
      createdAt: {
        gte: periodStart,
        lte: periodEnd
      },
      type: { in: ['IMPRESSION', 'VIEW', 'PURCHASE_CLICK'] }
    };
    const orderWhere = {
      gigId: { in: gigIds },
      status: 'COMPLETED',
      updatedAt: {
        gte: periodStart,
        lte: periodEnd
      }
    };

    const [eventGroups, orderGroups] = await Promise.all([
      prisma.gigAnalyticsEvent.groupBy({
        by: ['gigId', 'type'],
        where: eventWhere,
        _count: { _all: true }
      }),
      prisma.order.groupBy({
        by: ['gigId'],
        where: orderWhere,
        _count: { _all: true }
      })
    ]);

    const eventCountsByGig = new Map();
    for (const group of eventGroups) {
      if (!eventCountsByGig.has(group.gigId)) {
        eventCountsByGig.set(group.gigId, emptyMetrics());
      }

      const metrics = eventCountsByGig.get(group.gigId);
      const count = group._count?._all || 0;

      if (group.type === 'IMPRESSION') metrics.impressions = count;
      if (group.type === 'VIEW') metrics.views = count;
      if (group.type === 'PURCHASE_CLICK') metrics.clicks = count;
    }

    const ordersByGig = new Map(
      orderGroups.map((group) => [group.gigId, group._count?._all || 0])
    );

    const gigMetrics = gigs.map((gig) => {
      const metrics = eventCountsByGig.get(gig.id) || emptyMetrics();
      const orders = ordersByGig.get(gig.id) || 0;

      return {
        gigId: gig.id,
        title: gig.title,
        category: gig.category,
        ...metrics,
        orders,
        conversionRate: calculateConversionRate(orders, metrics.impressions)
      };
    });

    const totals = gigMetrics.reduce((sum, gig) => ({
      impressions: sum.impressions + gig.impressions,
      views: sum.views + gig.views,
      clicks: sum.clicks + gig.clicks,
      orders: sum.orders + gig.orders
    }), emptyMetrics());
    totals.conversionRate = calculateConversionRate(totals.orders, totals.impressions);

    return res.json({
      periodDays: ANALYTICS_WINDOW_DAYS,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      publishedGigCount: gigs.length,
      totals,
      gigs: gigMetrics
    });
  } catch (error) {
    console.error('Home Analytics Error:', error);
    return res.status(500).json({ error: 'Failed to load Home analytics.' });
  }
};
