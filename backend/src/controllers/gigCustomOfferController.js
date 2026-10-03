const prisma = require('../config/db');
const Razorpay = require('razorpay');
const { isGigAcceptingOrders } = require('../services/gigAvailabilityService');
const {
  ACTIVE_ORDER_STATUSES,
  getGigOrderCapacity
} = require('../services/gigOrderCapacityService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_for_dev',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

const offerInclude = {
  gig: {
    select: {
      id: true,
      title: true,
      status: true,
      coverImage: true,
      sellerId: true
    }
  },
  buyer: {
    select: {
      id: true,
      username: true,
      fullName: true
    }
  },
  seller: {
    select: {
      id: true,
      username: true,
      fullName: true
    }
  },
  order: {
    select: {
      id: true,
      status: true,
      totalAmount: true,
      razorpayOrderId: true
    }
  }
};

const getOfferId = (req) => String(req.params.offerId || '').trim();

exports.createOffer = async (req, res) => {
  try {
    if (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only clients can create custom gig offers.' });
    }

    const { gigId, requestedWork, proposedPrice, deliveryDays } = req.body;

    const normalizedWork = String(requestedWork || '').trim();
    const amount = Number(proposedPrice);
    const days = Number(deliveryDays);

    if (!gigId || !normalizedWork) {
      return res.status(400).json({ error: 'Gig and requested work are required.' });
    }

    if (normalizedWork.length > 5000) {
      return res.status(400).json({ error: 'Requested work must be 5000 characters or fewer.' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Proposed price must be greater than zero.' });
    }

    if (!Number.isInteger(days) || days <= 0) {
      return res.status(400).json({ error: 'Delivery days must be a positive whole number.' });
    }

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        status: 'PUBLISHED',
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        sellerId: true
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found or unavailable.' });
    }

    if (gig.sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot create a custom offer for your own gig.' });
    }

    const offer = await prisma.gigCustomOffer.create({
      data: {
        gigId: gig.id,
        buyerId: req.user.id,
        sellerId: gig.sellerId,
        requestedWork: normalizedWork,
        proposedPrice: Number(amount.toFixed(2)),
        deliveryDays: days
      },
      include: offerInclude
    });

    await prisma.notification.create({
      data: {
        userId: gig.sellerId,
        title: 'New Custom Offer',
        message: `A buyer sent you a custom offer for "${gig.title}" for ₹${offer.proposedPrice.toLocaleString('en-IN')} with ${offer.deliveryDays} days delivery.`,
        type: 'CUSTOM_OFFER_RECEIVED'
      }
    });

    return res.status(201).json({
      message: 'Custom offer sent successfully.',
      offer
    });
  } catch (err) {
    console.error('Create Custom Offer Error:', err);
    return res.status(500).json({ error: 'Failed to create custom offer.' });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await prisma.gigCustomOffer.findMany({
      where: req.user.role === 'ADMIN'
        ? {}
        : {
            OR: [
              { buyerId: req.user.id },
              { sellerId: req.user.id }
            ]
          },
      include: offerInclude,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(offers);
  } catch (err) {
    console.error('Get Custom Offers Error:', err);
    return res.status(500).json({ error: 'Failed to load custom offers.' });
  }
};

exports.respondToOffer = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT_FREELANCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the gig seller can respond to a custom offer.' });
    }

    const offerId = getOfferId(req);
    const action = String(req.body?.action || '').trim().toUpperCase();

    if (!offerId || !['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'A valid offer and response action are required.' });
    }

    const offer = await prisma.gigCustomOffer.findUnique({
      where: { id: offerId },
      include: {
        gig: { select: { id: true, title: true } }
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Custom offer not found.' });
    }

    if (offer.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (offer.status !== 'PENDING') {
      return res.status(409).json({ error: 'This custom offer has already been responded to.' });
    }

    const nextStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updatedOffer = await prisma.gigCustomOffer.update({
      where: { id: offer.id },
      data: { status: nextStatus },
      include: offerInclude
    });

    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        title: action === 'ACCEPT' ? 'Custom Offer Accepted' : 'Custom Offer Declined',
        message: action === 'ACCEPT'
          ? `The seller accepted your custom offer for "${offer.gig.title}". Review it and continue to payment when ready.`
          : `The seller declined your custom offer for "${offer.gig.title}".`,
        type: action === 'ACCEPT'
          ? 'CUSTOM_OFFER_ACCEPTED'
          : 'CUSTOM_OFFER_DECLINED'
      }
    });

    return res.json({
      message: action === 'ACCEPT'
        ? 'Custom offer accepted.'
        : 'Custom offer declined.',
      offer: updatedOffer
    });
  } catch (err) {
    console.error('Respond to Custom Offer Error:', err);
    return res.status(500).json({ error: 'Failed to respond to custom offer.' });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    if (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the buyer can accept a custom offer.' });
    }

    const offerId = getOfferId(req);
    if (!offerId) {
      return res.status(400).json({ error: 'Offer is required.' });
    }

    const offer = await prisma.gigCustomOffer.findUnique({
      where: { id: offerId },
      include: {
        gig: true,
        seller: {
          select: {
            id: true,
            razorpayAccountId: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Custom offer not found.' });
    }

    if (offer.buyerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (offer.status !== 'ACCEPTED') {
      return res.status(409).json({
        error: 'The seller must accept the custom offer before you can continue to payment.'
      });
    }

    if (offer.orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: offer.orderId }
      });

      return res.status(200).json({
        message: 'This custom offer has already been converted into an order.',
        offer,
        order: existingOrder,
        razorpayOrderId: existingOrder?.razorpayOrderId || null,
        checkoutRequired: Boolean(existingOrder?.status === 'PENDING_PAYMENT')
      });
    }

    if (
      offer.gig.status !== 'PUBLISHED' ||
      offer.gig.isDeleted !== false ||
      !isGigAcceptingOrders(offer.gig.draftData)
    ) {
      return res.status(409).json({
        error: 'This gig is no longer accepting new custom orders.'
      });
    }

    if (offer.sellerId === offer.buyerId) {
      return res.status(400).json({ error: 'Buyer and seller cannot be the same account.' });
    }

    const amount = Number(offer.proposedPrice);
    const days = Number(offer.deliveryDays);

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(days) || days <= 0) {
      return res.status(409).json({ error: 'This custom offer contains invalid pricing or delivery terms.' });
    }

    const platformFee = Number((amount * 0.06).toFixed(2));
    const sellerEarnings = Number((amount - platformFee).toFixed(2));
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    const linkedAccountId =
      offer.seller.razorpayAccountId || process.env.DEV_LINKED_ACCOUNT_ID;

    const transfers = linkedAccountId
      ? [{
          account: linkedAccountId,
          amount: Math.round(sellerEarnings * 100),
          currency: 'INR',
          notes: { purpose: 'Escrow for Gig Custom Offer' },
          on_hold: true
        }]
      : undefined;

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `custom_${offer.id.slice(0, 8)}_${Date.now()}`,
      transfers
    });

    const result = await prisma.$transaction(async (tx) => {
      const lockedOffers = await tx.$queryRaw`
        SELECT id, "gigId", "buyerId", "sellerId", "status", "orderId"
        FROM "GigCustomOffer"
        WHERE id = ${offer.id}
        FOR UPDATE
      `;

      if (!lockedOffers || lockedOffers.length === 0) {
        throw new Error('OFFER_NOT_FOUND');
      }

      const lockedOffer = lockedOffers[0];

      if (
        lockedOffer.buyerId !== req.user.id &&
        req.user.role !== 'ADMIN'
      ) {
        throw new Error('FORBIDDEN');
      }

      if (lockedOffer.status !== 'ACCEPTED') {
        throw new Error('OFFER_NO_LONGER_ACCEPTED');
      }

      if (lockedOffer.orderId) {
        const existing = await tx.order.findUnique({
          where: { id: lockedOffer.orderId }
        });

        return {
          order: existing,
          alreadyConverted: true
        };
      }

      const lockedGigRows = await tx.$queryRaw`
        SELECT id, "draftData", status, "isDeleted"
        FROM "Gig"
        WHERE id = ${offer.gigId}
        FOR UPDATE
      `;

      if (!lockedGigRows || lockedGigRows.length === 0) {
        throw new Error('GIG_NOT_FOUND');
      }

      const lockedGig = lockedGigRows[0];

      if (
        lockedGig.status !== 'PUBLISHED' ||
        lockedGig.isDeleted !== false ||
        !isGigAcceptingOrders(lockedGig.draftData)
      ) {
        throw new Error('GIG_NOT_AVAILABLE');
      }

      const activeOrderLimit = getGigOrderCapacity(lockedGig.draftData);

      if (activeOrderLimit !== null) {
        const activeOrderCount = await tx.order.count({
          where: {
            gigId: offer.gigId,
            status: { in: ACTIVE_ORDER_STATUSES }
          }
        });

        if (activeOrderCount >= activeOrderLimit) {
          throw new Error('GIG_ACTIVE_ORDER_CAP_REACHED');
        }
      }

      const existingPending = await tx.order.findFirst({
        where: {
          clientId: offer.buyerId,
          gigId: offer.gigId,
          customOffer: { is: { id: offer.id } },
          status: 'PENDING_PAYMENT'
        },
        select: { id: true }
      });

      if (existingPending) {
        throw new Error('CUSTOM_OFFER_ORDER_EXISTS');
      }

      const createdOrder = await tx.order.create({
        data: {
          clientId: offer.buyerId,
          sellerId: offer.sellerId,
          gigId: offer.gigId,
          totalAmount: amount,
          platformFee,
          sellerEarnings,
          status: 'PENDING_PAYMENT',
          razorpayOrderId: rpOrder.id,
          deadline,
          requirements: offer.requestedWork,
          customOffer: {
            connect: { id: offer.id }
          }
        }
      });

      const razorpayTransfer = Array.isArray(rpOrder.transfers)
        ? rpOrder.transfers[0]
        : rpOrder.transfers?.items?.[0];

      if (razorpayTransfer?.id) {
        await tx.transfer.create({
          data: {
            orderId: createdOrder.id,
            razorpayTransferId: razorpayTransfer.id,
            amount: sellerEarnings,
            onHold: true,
            status: 'PENDING'
          }
        });
      }

      await tx.orderActivityEvent.create({
        data: {
          orderId: createdOrder.id,
          actorId: req.user.id,
          type: 'ORDER_CREATED',
          message: 'Gig custom offer converted into a payment-ready order.',
          source: 'CUSTOM_OFFER_CONTROLLER',
          metadata: {
            customOfferId: offer.id,
            gigId: offer.gigId,
            proposedPrice: amount,
            deliveryDays: days,
            razorpayOrderId: rpOrder.id
          }
        }
      });

      await tx.gigCustomOffer.update({
        where: { id: offer.id },
        data: { orderId: createdOrder.id }
      });

      await tx.notification.create({
        data: {
          userId: offer.sellerId,
          orderId: createdOrder.id,
          title: 'Custom Offer Ready for Payment',
          message: 'The buyer accepted your approved custom offer and created a payment-ready order.',
          type: 'CUSTOM_OFFER_CONVERTED'
        }
      });

      return {
        order: createdOrder,
        alreadyConverted: false
      };
    });

    return res.status(result.alreadyConverted ? 200 : 201).json({
      message: result.alreadyConverted
        ? 'This custom offer has already been converted into an order.'
        : 'Custom offer converted into a payment-ready order.',
      order: result.order,
      razorpayOrderId: result.order?.razorpayOrderId || rpOrder.id,
      checkoutRequired: result.order?.status === 'PENDING_PAYMENT'
    });
  } catch (err) {
    console.error('Accept Custom Offer Error:', err);

    const statusMap = {
      OFFER_NOT_FOUND: [404, 'Custom offer not found.'],
      FORBIDDEN: [403, 'Access denied.'],
      OFFER_NO_LONGER_ACCEPTED: [409, 'This custom offer is no longer available for acceptance.'],
      GIG_NOT_FOUND: [404, 'Gig not found.'],
      GIG_NOT_AVAILABLE: [409, 'This gig is no longer accepting new custom orders.'],
      GIG_ACTIVE_ORDER_CAP_REACHED: [409, 'This gig has reached its active-order capacity.'],
      CUSTOM_OFFER_ORDER_EXISTS: [409, 'This custom offer already has a payment order.']
    };

    const mapped = statusMap[err.message];
    if (mapped) {
      return res.status(mapped[0]).json({ error: mapped[1] });
    }

    return res.status(500).json({ error: 'Failed to accept custom offer.' });
  }
};
