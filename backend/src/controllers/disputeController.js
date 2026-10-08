const prisma = require('../config/db');
const { releaseTransfer } = require('../services/escrowService');
const { refundPayment } = require('../services/refundService');

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
    if (err.message === 'REFUND_PAYMENT_REFERENCE_MISSING') {
      return res.status(409).json({
        error: 'A verified payment reference is required before a client refund can be processed.'
      });
    }

    if (
      err.message === 'PAYMENT_REFERENCE_MISSING' ||
      err.message === 'REFUND_AMOUNT_INVALID' ||
      err.message === 'REFUND_REFERENCE_MISSING'
    ) {
      return res.status(409).json({
        error: 'The payment provider could not verify the refund reference.'
      });
    }

    if (err.message === 'REFUND_FAILED') {
      return res.status(502).json({
        error: 'The payment provider did not accept the refund request.'
      });
    }

    res.status(500).json({ error: 'Failed to resolve dispute.' });
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
    res.status(500).json({ error: 'Request could not be completed.' });
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
    res.status(500).json({ error: 'Request could not be completed.' });
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

        if (!transferRecord || !transferRecord.razorpayTransferId) {
          throw new Error(
            'ESCROW_RELEASE_NOT_COMPLETED: A verified Razorpay transfer is required before funds can be released.'
          );
        }

        if (transferRecord.onHold || transferRecord.status !== 'RELEASED') {
          const result = await releaseTransfer(transferRecord);

          if (!result.released) {
            throw new Error(
              `ESCROW_RELEASE_NOT_COMPLETED: ${result.reason}`
            );
          }
        }

        if (transferRecord.onHold || transferRecord.status !== 'RELEASED') {
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

        if (!transferRecord.walletCreditedAt) {
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

          await tx.transfer.update({
            where: { id: transferRecord.id },
            data: { walletCreditedAt: new Date() }
          });
        }

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
      if (!dispute.order.razorpayPaymentId) {
        throw new Error('REFUND_PAYMENT_REFERENCE_MISSING');
      }

      if (dispute.order.refundStatus === 'PROCESSED') {
        return res.status(200).json({
          message: 'The refund was already confirmed.'
        });
      }

      const refund = await refundPayment(
        dispute.order.razorpayPaymentId,
        dispute.order.totalAmount
      );

      const refundStatus = String(refund?.status || '').toUpperCase();
      const refundId = refund?.id || null;

      if (!refundId) {
        throw new Error('REFUND_REFERENCE_MISSING');
      }

      if (refundStatus === 'PROCESSED') {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: dispute.orderId },
            data: {
              status: 'CANCELLED_REFUNDED',
              razorpayRefundId: refundId,
              refundStatus: 'PROCESSED'
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
              type: 'REFUND_PROCESSED',
              message: 'Dispute resolved: Razorpay confirmed the client refund.',
              source: 'DISPUTE_CONTROLLER',
              metadata: {
                disputeId: dispute.id,
                decision,
                refundId,
                refundStatus
              }
            }
          })
        ]);

        return res.status(200).json({
          message: 'Dispute resolved and the client refund was confirmed.',
          refundStatus
        });
      }

      if (['PENDING', 'CREATED', 'PROCESSING'].includes(refundStatus)) {
        await prisma.order.update({
          where: { id: dispute.orderId },
          data: {
            razorpayRefundId: refundId,
            refundStatus
          }
        });

        await prisma.orderActivityEvent.create({
          data: {
            orderId: dispute.orderId,
            actorId: req.user.id,
            type: 'REFUND_INITIATED',
            message: 'Client refund initiated with Razorpay; awaiting provider confirmation.',
            source: 'DISPUTE_CONTROLLER',
            metadata: {
              disputeId: dispute.id,
              decision,
              refundId,
              refundStatus
            }
          }
        });

        return res.status(202).json({
          message: 'Client refund initiated; waiting for Razorpay confirmation.',
          refundStatus
        });
      }

      throw new Error('REFUND_FAILED');

    } else {
      return res.status(400).json({
        error: 'Invalid decision.'
      });
    }

    res.json({
      message: 'Dispute resolved successfully.'
    });

  } catch (err) {
    res.status(500).json({ error: 'Request could not be completed.' });
  }
};
