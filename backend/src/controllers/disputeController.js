const prisma = require('../config/db');
const { releaseTransfer } = require('../services/escrowService');

exports.createDispute = async (req, res) => {
  try {
    const { orderId, reason, evidence } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (
      order.clientId !== req.user.id &&
      order.sellerId !== req.user.id
    ) {
      return res.status(403).json({ error: 'You are not part of this order.' });
    }

    if (
      ['PENDING_PAYMENT', 'COMPLETED', 'CANCELLED_REFUNDED']
        .includes(order.status)
    ) {
      return res.status(400).json({
        error: 'Dispute cannot be opened for this order status.'
      });
    }

    const existingDispute = await prisma.dispute.findUnique({
      where: { orderId }
    });

    if (existingDispute) {

      if (existingDispute.openedById === req.user.id) {
        return res.status(400).json({
          error: 'You have already submitted your dispute statement.'
        });
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id: existingDispute.id },
        data: {
          sellerReason: reason,
          sellerEvidence: evidence
        }
      });

      return res.status(200).json({
        message: 'Your dispute response has been added.',
        dispute: updatedDispute
      });
    }

    const dispute = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'DISPUTED' }
      });

      const dispute = await tx.dispute.create({
        data: {
          orderId,
          openedById: req.user.id,
          reason,
          evidence
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'DISPUTE_OPENED',
          message: 'Dispute opened for this order.',
          source: 'DISPUTE_CONTROLLER',
          metadata: {
            disputeId: dispute.id
          }
        }
      });

      return dispute;
    });

    res.status(201).json({
      message: 'Dispute opened successfully.',
      dispute
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      where: {
        openedById: req.user.id
      },
      include: {
        order: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        order: true,
        openedBy: {
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

    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: true
      }
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found.' });
    }

    if (dispute.status === 'RESOLVED') {
      return res.status(409).json({
        error: 'Dispute has already been resolved.'
      });
    }

    if (decision === 'RELEASE_TO_SELLER') {

      const latestDeliverable = await prisma.deliverable.findFirst({
        where: { orderId: dispute.orderId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true }
      });

      await prisma.$transaction(async (tx) => {
        const lockedOrders = await tx.$queryRaw`
          SELECT id
          FROM "Order"
          WHERE id = ${dispute.orderId}
          FOR UPDATE
        `;

        if (!lockedOrders || lockedOrders.length === 0) {
          throw new Error('ESCROW_RELEASE_ORDER_NOT_FOUND');
        }

        const transferRecord = await tx.transfer.findUnique({
          where: { orderId: dispute.orderId }
        });

        if (transferRecord?.razorpayTransferId && transferRecord.onHold) {
          const result = await releaseTransfer(transferRecord);

          if (!result.released) {
            throw new Error(
              `ESCROW_RELEASE_NOT_COMPLETED: ${result.reason}`
            );
          }

          await tx.transfer.update({
            where: { id: transferRecord.id },
            data: {
              onHold: false,
              status: 'RELEASED'
            }
          });
        }

        if (latestDeliverable) {
          await tx.deliverable.update({
            where: { id: latestDeliverable.id },
            data: {
              reviewStatus: 'DISPUTE_RESOLVED',
              reviewedAt: new Date(),
              reviewedById: req.user.id
            }
          });
        }

        await tx.order.update({
          where: { id: dispute.orderId },
          data: { status: 'COMPLETED' }
        });

        if (dispute.order.jobId) {
          await tx.job.update({
            where: { id: dispute.order.jobId },
            data: {
              status: 'COMPLETED',
              isOpen: false
            }
          });
        }

        await tx.wallet.upsert({
          where: { userId: dispute.order.sellerId },
          create: {
            userId: dispute.order.sellerId,
            availableBalance: dispute.order.sellerEarnings
          },
          update: {
            availableBalance: {
              increment: dispute.order.sellerEarnings
            }
          }
        });

        await tx.dispute.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            adminDecision: decision,
            resolvedAt: new Date()
          }
        });

        await tx.orderActivityEvent.create({
          data: {
            orderId: dispute.orderId,
            actorId: req.user.id,
            type: 'DISPUTE_RESOLVED',
            message: 'Dispute resolved: funds released to the freelancer.',
            source: 'DISPUTE_CONTROLLER',
            metadata: {
              disputeId: dispute.id,
              decision
            }
          }
        });
      });

    } else if (decision === 'REFUND_CLIENT') {

      await prisma.$transaction([
        prisma.order.update({
          where: { id: dispute.orderId },
          data: {
            status: 'CANCELLED_REFUNDED'
          }
        }),

        ...(dispute.order.jobId ? [
          prisma.job.update({
            where: { id: dispute.order.jobId },
            data: {
              status: 'CANCELLED',
              isOpen: false
            }
          })
        ] : []),

        prisma.dispute.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            adminDecision: decision,
            resolvedAt: new Date()
          }
        }),
        prisma.orderActivityEvent.create({
          data: {
            orderId: dispute.orderId,
            actorId: req.user.id,
            type: 'DISPUTE_RESOLVED',
            message: 'Dispute resolved: order moved to cancelled/refunded state.',
            source: 'DISPUTE_CONTROLLER',
            metadata: {
              disputeId: dispute.id,
              decision,
              financialOutcome: 'LOCAL_CANCELLED_REFUNDED'
            }
          }
        }),
        prisma.orderActivityEvent.create({
          data: {
            orderId: dispute.orderId,
            actorId: req.user.id,
            type: 'ORDER_CANCELLED',
            message: 'Order cancelled following dispute resolution in favor of the client.',
            source: 'DISPUTE_CONTROLLER',
            metadata: {
              disputeId: dispute.id,
              cancellationType: 'DISPUTE_RESOLUTION',
              financialOutcome: 'LOCAL_CANCELLED_REFUNDED',
              gatewayRefundConfirmed: false
            }
          }
        })
      ]);

    } else {
      return res.status(400).json({
        error: 'Invalid decision.'
      });
    }

    res.json({
      message: 'Dispute resolved successfully.'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
