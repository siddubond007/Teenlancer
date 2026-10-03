const prisma = require('../config/db');

exports.createReview = async (req, res) => {
  try {
    const { orderId } = req.params;

    const {
      overallRating,
      communicationRating,
      qualityRating,
      timelinessRating,
      comment
    } = req.body;

    const ratings = [
      overallRating,
      communicationRating,
      qualityRating,
      timelinessRating
    ];

    if (ratings.some(r => !Number.isInteger(r) || r < 1 || r > 5)) {
      return res.status(400).json({
        error: 'All ratings must be integers between 1 and 5.'
      });
    }

    if (!comment || comment.trim().length < 10 || comment.trim().length > 1000) {
      return res.status(400).json({
        error: 'Comment must be between 10 and 1000 characters.'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Reviews can only be submitted for completed orders.'
      });
    }

    const isClient = order.clientId === req.user.id;
    const isSeller = order.sellerId === req.user.id;

    if (!isClient && !isSeller) {
      return res.status(403).json({
        error: 'Only order participants can submit reviews.'
      });
    }

    const revieweeId = isClient
      ? order.sellerId
      : order.clientId;

    if (revieweeId === req.user.id) {
      return res.status(400).json({
        error: 'Users cannot review themselves.'
      });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        orderId,
        reviewerId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({
        error: 'You have already reviewed this order.'
      });
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          orderId,
          reviewerId: req.user.id,
          revieweeId,
          overallRating,
          communicationRating,
          qualityRating,
          timelinessRating,
          comment: comment.trim()
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'REVIEW_SUBMITTED',
          message: `Review submitted with ${overallRating}/5 overall rating.`,
          source: 'REVIEW_CONTROLLER',
          metadata: {
            reviewId: createdReview.id,
            revieweeId,
            overallRating,
            communicationRating,
            qualityRating,
            timelinessRating
          }
        }
      });

      return createdReview;
    });

    const reviewer = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { fullName: true }
    });

    await prisma.notification.create({
      data: {
        userId: revieweeId,
        title: 'New Review Received',
        message: `${reviewer?.fullName || 'A user'} rated you ${overallRating}/5 stars.`,
        type: 'REVIEW_RECEIVED'
      }
    });

    const reviewStats = await prisma.review.aggregate({
      where: {
        revieweeId
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
      where: {
        id: revieweeId
      },
      data: {
        averageRating: Number(reviewStats._avg.overallRating || 0),
        communicationAvg: Number(reviewStats._avg.communicationRating || 0),
        qualityAvg: Number(reviewStats._avg.qualityRating || 0),
        timelinessAvg: Number(reviewStats._avg.timelinessRating || 0),
        totalReviews: reviewStats._count.id,
        points: { increment: 10 }
      }
    });

    return res.status(201).json(review);

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        isVisible: true
      },
      include: {
        reviewer: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reviews);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
