const crypto = require('crypto');
const prisma = require('../config/db');

function signaturesMatch(expected, received) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(String(received || ''), 'utf8');

  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

exports.handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('Razorpay webhook secret is not configured.');
    return res.status(503).json({ error: 'Webhook processing is not configured.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const eventId = req.headers['x-razorpay-event-id'];

  if (!signature || !eventId) {
    return res.status(400).send('Missing essential headers');
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Invalid webhook body.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (!signaturesMatch(expectedSignature, signature)) {
    console.error('Razorpay webhook signature mismatch.');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload.' });
  }

  const eventType = typeof payload.event === 'string'
    ? payload.event.trim()
    : '';

  if (!eventType) {
    return res.status(400).json({ error: 'Webhook event type is missing.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Claim the event inside the same transaction as its business effects.
      // The UNIQUE eventId constraint makes concurrent duplicates safe.
      try {
        await tx.webhookLog.create({
          data: { eventId, eventType }
        });
      } catch (error) {
        if (error?.code === 'P2002') {
          const duplicate = new Error('WEBHOOK_ALREADY_PROCESSED');
          duplicate.code = 'WEBHOOK_ALREADY_PROCESSED';
          throw duplicate;
        }
        throw error;
      }

      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = payload?.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const razorpayPaymentId = paymentEntity?.id;

        if (!razorpayOrderId || !razorpayPaymentId) {
          throw new Error('INVALID_PAYMENT_WEBHOOK');
        }

        const order = await tx.order.findFirst({
          where: { razorpayOrderId },
          select: {
            id: true,
            status: true,
            jobId: true,
            sellerId: true
          }
        });

        if (!order) {
          throw new Error('LOCAL_ORDER_NOT_FOUND');
        }

        if (order.status === 'PENDING_PAYMENT') {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'FUNDED_IN_ESCROW',
              razorpayPaymentId
            }
          });

          await tx.orderActivityEvent.create({
            data: {
              orderId: order.id,
              actorId: null,
              type: 'PAYMENT_SECURED',
              message: 'Payment captured and funds secured in escrow.',
              source: 'RAZORPAY_WEBHOOK',
              metadata: {
                razorpayOrderId,
                razorpayPaymentId,
                eventType
              }
            }
          });

          if (order.jobId) {
            await tx.job.update({
              where: { id: order.jobId },
              data: {
                status: 'IN_PROGRESS',
                isOpen: false
              }
            });

            await tx.bid.updateMany({
              where: {
                jobId: order.jobId,
                studentId: order.sellerId
              },
              data: {
                status: 'HIRED'
              }
            });
          }
        }
      }

      if (eventType === 'refund.processed') {
        const refundEntity = payload?.payload?.refund?.entity;
        const refundId = refundEntity?.id;
        const paymentId = refundEntity?.payment_id;

        if (!refundId || !paymentId) {
          throw new Error('INVALID_REFUND_WEBHOOK');
        }

        const refundedOrder = await tx.order.findFirst({
          where: { razorpayPaymentId: paymentId },
          select: { id: true, status: true }
        });

        if (!refundedOrder) {
          throw new Error('LOCAL_ORDER_NOT_FOUND');
        }

        if (refundedOrder.status !== 'CANCELLED_REFUNDED') {
          await tx.order.update({
            where: { id: refundedOrder.id },
            data: {
              status: 'CANCELLED_REFUNDED',
              razorpayRefundId: refundId,
              refundStatus: 'PROCESSED'
            }
          });

          if (eventType === 'refund.processed') {
            await tx.orderActivityEvent.create({
              data: {
                orderId: refundedOrder.id,
                actorId: null,
                type: 'REFUND_PROCESSED',
                message: 'Payment refund was confirmed by Razorpay.',
                source: 'RAZORPAY_WEBHOOK',
                metadata: {
                  refundId,
                  paymentId,
                  eventType
                }
              }
            });
          }
        }
      }
    });

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    if (error?.code === 'WEBHOOK_ALREADY_PROCESSED') {
      return res.status(200).send('Webhook already processed');
    }

    if (
      error?.message === 'INVALID_PAYMENT_WEBHOOK' ||
      error?.message === 'INVALID_REFUND_WEBHOOK'
    ) {
      return res.status(400).json({ error: 'Invalid webhook event payload.' });
    }

    if (error?.message === 'LOCAL_ORDER_NOT_FOUND') {
      // Return 200 so an unrelated/late event is not retried indefinitely.
      return res.status(200).json({ status: 'ignored' });
    }

    console.error('Critical Razorpay webhook error:', error);
    return res.status(500).send('Webhook server error');
  }
};
