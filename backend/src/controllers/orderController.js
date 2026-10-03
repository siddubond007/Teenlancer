const prisma = require('../config/db');
const Razorpay = require('razorpay');
const { releaseTransfer } = require('../services/escrowService');
const { isGigAcceptingOrders } = require('../services/gigAvailabilityService');
const {
  ACTIVE_ORDER_STATUSES,
  getGigOrderCapacity
} = require('../services/gigOrderCapacityService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_for_dev',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Create Order & Fund Escrow
exports.createOrder = async (req, res) => {
  try {
    const { sellerId, gigId, jobId, totalAmount, deliveryDays, requirements } = req.body;

    // Job hiring must go through the atomic acceptBid flow so the
    // Job/Bid/Order state machine cannot be bypassed.
    if (jobId) {
      return res.status(409).json({
        error: 'Job orders must be created through the hiring workflow.'
      });
    }
    
    // 1. Financial Math
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    
    const platformFee = Number((amount * 0.06).toFixed(2));
    const sellerEarnings = Number((amount * 0.94).toFixed(2));
    const days = parseInt(deliveryDays, 10) || 3;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    // 2. Fetch Freelancer to get their Razorpay Linked Account ID
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ error: 'Freelancer not found' });
    
    // Fallback account logic for development. In production, fail if not linked.
    const linkedAccountId = seller.razorpayAccountId || process.env.DEV_LINKED_ACCOUNT_ID;

    // 3. Construct Compliant Escrow Transfers Array (on_hold: true)
    let transfers = [];
    if (linkedAccountId) {
      transfers.push({
        account: linkedAccountId,
        amount: Math.round(sellerEarnings * 100), // Razorpay expects paise
        currency: "INR",
        notes: { purpose: "Escrow for Project Delivery" },
        on_hold: true // RBI Mandate: Funds sit in nodal account until explicit release
      });
    }

    // 4. Create Gateway Order
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      transfers: transfers.length > 0 ? transfers : undefined
    });

    // 5. Create Local Database State (Status: PENDING_PAYMENT)
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          clientId: req.user.id,
          sellerId,
          gigId: gigId || null,
          jobId: jobId || null,
          totalAmount: amount,
          platformFee,
          sellerEarnings,
          status: 'PENDING_PAYMENT',
          razorpayOrderId: rpOrder.id,
          deadline,
          requirements: requirements || 'Standard project deliverables.'
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
          message: 'Order created and payment initiated.',
          source: 'ORDER_CONTROLLER',
          metadata: {
            totalAmount: amount,
            razorpayOrderId: rpOrder.id
          }
        }
      });

      return createdOrder;
    });

    res.status(201).json({ 
      message: 'Gateway order generated successfully.', 
      order,
      razorpayOrderId: rpOrder.id
    });
  } catch (err) {
    console.error('Escrow Gateway Error:', err);
    res.status(500).json({ error: 'Escrow gateway failure: ' + err.message });
  }
}

// Create a gig purchase order from a server-validated gig package.
exports.createGigOrder = async (req, res) => {
  try {
    if (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only clients can purchase gigs.' });
    }

    const { gigId, gigPackageId, requirements } = req.body;

    if (!gigId || !gigPackageId) {
      return res.status(400).json({ error: 'Gig and package are required.' });
    }

    const gig = await prisma.gig.findFirst({
      where: {
        id: gigId,
        status: 'PUBLISHED',
        isDeleted: false
      },
      include: {
        packages: {
          where: { id: gigPackageId },
          take: 1
        }
      }
    });

    if (!gig || gig.packages.length === 0) {
      return res.status(404).json({ error: 'Gig package not found or unavailable.' });
    }

    if (!isGigAcceptingOrders(gig.draftData)) {
      return res.status(409).json({
        error: 'This gig is not currently accepting new orders.'
      });
    }

    if (gig.sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own gig.' });
    }

    const selectedPackage = gig.packages[0];
    const amount = Number(selectedPackage.price);
    const days = Number(selectedPackage.deliveryDays);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'This gig package has an invalid price.' });
    }

    if (!Number.isInteger(days) || days <= 0) {
      return res.status(400).json({ error: 'This gig package has an invalid delivery period.' });
    }

    const platformFee = Number((amount * 0.06).toFixed(2));
    const sellerEarnings = Number((amount - platformFee).toFixed(2));
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    const seller = await prisma.user.findUnique({
      where: { id: gig.sellerId },
      select: { id: true, razorpayAccountId: true }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Freelancer account not found.' });
    }

    const linkedAccountId =
      seller.razorpayAccountId || process.env.DEV_LINKED_ACCOUNT_ID;

    const transfers = linkedAccountId
      ? [{
          account: linkedAccountId,
          amount: Math.round(sellerEarnings * 100),
          currency: 'INR',
          notes: { purpose: 'Escrow for Gig Purchase' },
          on_hold: true
        }]
      : undefined;

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `gig_${gig.id.slice(0, 8)}_${Date.now()}`,
      transfers
    });

    const order = await prisma.$transaction(async (tx) => {
      const lockedGigRows = await tx.$queryRaw`
        SELECT id, "draftData"
        FROM "Gig"
        WHERE id = ${gig.id}
          AND status = 'PUBLISHED'
          AND "isDeleted" = false
        FOR UPDATE
      `;

      if (!lockedGigRows || lockedGigRows.length === 0) {
        throw new Error('GIG_NOT_AVAILABLE');
      }

      const lockedGig = lockedGigRows[0];
      const activeOrderLimit = getGigOrderCapacity(lockedGig.draftData);

      if (activeOrderLimit !== null) {
        const activeOrderCount = await tx.order.count({
          where: {
            gigId: gig.id,
            status: {
              in: ACTIVE_ORDER_STATUSES
            }
          }
        });

        if (activeOrderCount >= activeOrderLimit) {
          throw new Error('GIG_ACTIVE_ORDER_CAP_REACHED');
        }
      }

      const existingPending = await tx.order.findFirst({
        where: {
          clientId: req.user.id,
          gigId: gig.id,
          gigPackageId: selectedPackage.id,
          status: 'PENDING_PAYMENT'
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });

      if (existingPending) {
        throw new Error('PENDING_GIG_PURCHASE_EXISTS');
      }

      const createdOrder = await tx.order.create({
        data: {
          clientId: req.user.id,
          sellerId: gig.sellerId,
          gigId: gig.id,
          gigPackageId: selectedPackage.id,
          totalAmount: amount,
          platformFee,
          sellerEarnings,
          status: 'PENDING_PAYMENT',
          razorpayOrderId: rpOrder.id,
          deadline,
          requirements:
            requirements?.trim() ||
            `Purchase of ${selectedPackage.tierName} package for ${gig.title}.`
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
          message: `Gig purchase created for ${selectedPackage.tierName} package.`,
          source: 'GIG_ORDER_CONTROLLER',
          metadata: {
            gigId: gig.id,
            gigPackageId: selectedPackage.id,
            packagePrice: amount,
            deliveryDays: days,
            razorpayOrderId: rpOrder.id
          }
        }
      });

      return createdOrder;
    });

    return res.status(201).json({
      message: 'Gig purchase checkout initialized.',
      order,
      razorpayOrderId: rpOrder.id,
      checkoutRequired: true
    });
  } catch (err) {
    console.error('Create Gig Order Error:', err);

    if (err.message === 'PENDING_GIG_PURCHASE_EXISTS') {
      return res.status(409).json({
        error: 'A payment attempt is already pending for this gig package.'
      });
    }

    if (err.message === 'GIG_ACTIVE_ORDER_CAP_REACHED') {
      return res.status(409).json({
        error: 'This gig has reached its active-order capacity and is not accepting new orders right now.'
      });
    }

    if (err.message === 'GIG_NOT_AVAILABLE') {
      return res.status(409).json({
        error: 'This gig is no longer available for new orders.'
      });
    }

    return res.status(500).json({ error: 'Failed to initialize gig purchase.' });
  }
};

// Verify Razorpay Checkout payment and activate the hiring state.
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        error: 'Incomplete Razorpay payment verification data.'
      });
    }

    const localOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!localOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (
      localOrder.clientId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (localOrder.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        error: 'Razorpay order does not match the local hiring order.'
      });
    }

    const expectedSignature = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        error: 'Invalid Razorpay payment signature.'
      });
    }

    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      return res.status(400).json({
        error: 'Payment does not belong to the expected Razorpay order.'
      });
    }

    if (Number(payment.amount) !== Math.round(localOrder.totalAmount * 100)) {
      return res.status(400).json({
        error: 'Payment amount does not match the hiring order amount.'
      });
    }

    if (payment.status !== 'captured') {
      return res.status(409).json({
        error: 'Payment has not been captured yet. Hiring will activate after capture.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw`
        SELECT * FROM "Order"
        WHERE id = ${orderId}
        FOR UPDATE
      `;

      if (!lockedOrders || lockedOrders.length === 0) {
        throw new Error('NOT_FOUND: Order not found');
      }

      const lockedOrder = lockedOrders[0];

      if (
        lockedOrder.clientId !== req.user.id &&
        req.user.role !== 'ADMIN'
      ) {
        throw new Error('FORBIDDEN: Access denied');
      }

      if (lockedOrder.razorpayOrderId !== razorpayOrderId) {
        throw new Error('BAD_REQUEST: Razorpay order mismatch');
      }

      if (lockedOrder.status === 'FUNDED_IN_ESCROW' || lockedOrder.status === 'IN_PROGRESS') {
        return { alreadyFunded: true, order: lockedOrder };
      }

      if (lockedOrder.status !== 'PENDING_PAYMENT') {
        throw new Error('BAD_REQUEST: Order is no longer awaiting payment.');
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'FUNDED_IN_ESCROW',
          razorpayPaymentId
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'PAYMENT_SECURED',
          message: 'Payment captured and funds secured in escrow.',
          source: 'PAYMENT_VERIFICATION',
          metadata: {
            razorpayOrderId,
            razorpayPaymentId
          }
        }
      });

      if (lockedOrder.jobId) {
        await tx.job.update({
          where: { id: lockedOrder.jobId },
          data: {
            status: 'IN_PROGRESS',
            isOpen: false
          }
        });

        await tx.bid.updateMany({
          where: {
            jobId: lockedOrder.jobId,
            studentId: lockedOrder.sellerId
          },
          data: {
            status: 'HIRED'
          }
        });
      }

      return { alreadyFunded: false, order: updatedOrder };
    });

    return res.json({
      success: true,
      alreadyFunded: result.alreadyFunded,
      message: result.alreadyFunded
        ? 'Payment was already verified and the freelancer is hired.'
        : 'Payment verified successfully. Escrow funded and the freelancer is now hired.',
      order: result.order
    });
  } catch (err) {
    console.error('Verify Payment Error:', err);

    if (err.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({
        error: err.message.replace('NOT_FOUND: ', '')
      });
    }

    if (err.message.startsWith('FORBIDDEN:')) {
      return res.status(403).json({
        error: err.message.replace('FORBIDDEN: ', '')
      });
    }

    if (err.message.startsWith('BAD_REQUEST:')) {
      return res.status(400).json({
        error: err.message.replace('BAD_REQUEST: ', '')
      });
    }

    return res.status(500).json({
      error: 'Unable to verify Razorpay payment.'
    });
  }
};


// Get a single Order Workspace
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            fullName: true,
            averageRating: true,
            totalReviews: true,
            role: true,
            profile: {
              select: {
                avatarUrl: true,
                tagline: true,
                bio: true,
                college: true,
                skills: true,
                badges: true
              }
            }
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            averageRating: true,
            totalReviews: true,
            role: true,
            profile: {
              select: {
                avatarUrl: true,
                tagline: true,
                bio: true,
                college: true,
                skills: true,
                badges: true
              }
            }
          }
        },
        job: true,
        gig: {
          include: {
            categoryRef: true,
            subcategoryRef: true
          }
        },
        GigPackage: true,
        deliverables: {
          orderBy: { submittedAt: 'desc' }
        },
        transfer: true,
        dispute: true,
        reviews: {
          select: {
            id: true,
            reviewerId: true,
            revieweeId: true,
            overallRating: true,
            communicationRating: true,
            qualityRating: true,
            timelinessRating: true,
            comment: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        activityEvents: {
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const isParticipant =
      order.clientId === req.user.id ||
      order.sellerId === req.user.id;

    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(order);
  } catch (err) {
    console.error('Get Order Workspace Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get User's Active Orders
exports.getMyOrders = async (req, res) => {
  try {
    const isStudent = req.user.role === 'STUDENT_FREELANCER';

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { clientId: req.user.id },
          {
            sellerId: req.user.id,
            ...(isStudent ? { status: { not: 'PENDING_PAYMENT' } } : {})
          }
        ]
      },
      include: {
        client: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true, age: true } },
        deliverables: true,
        reviews: {
          select: {
            id: true,
            reviewerId: true,
            revieweeId: true,
            overallRating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student Submits Deliverable
exports.submitDeliverable = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { fileUrls, driveLinks, message } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId: req.user.id }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found or unauthorized'
      });
    }

    if (!['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.status)) {
      return res.status(409).json({
        error: order.status === 'DELIVERED'
          ? 'A submitted delivery must be reviewed before another delivery can be submitted.'
          : 'Deliverables can only be submitted after payment has been verified and the project is active.'
      });
    }

    const autoApproveAt = new Date();
    autoApproveAt.setDate(autoApproveAt.getDate() + 5); // 5-day review timer

    const [deliverable, updatedOrder] = await prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw`
        SELECT id
        FROM "Order"
        WHERE id = ${orderId}
          AND "sellerId" = ${req.user.id}
        FOR UPDATE
      `;

      if (!lockedOrders || lockedOrders.length === 0) {
        throw new Error('ORDER_LOCK_FAILED');
      }

      const latestDeliverable = await tx.deliverable.findFirst({
        where: { orderId },
        orderBy: { version: 'desc' },
        select: { version: true }
      });

      const nextVersion = (latestDeliverable?.version || 0) + 1;

      const createdDeliverable = await tx.deliverable.create({
        data: {
          orderId,
          fileUrls: fileUrls || [],
          driveLinks: driveLinks || [],
          message: message || 'Work completed and submitted for review.',
          version: nextVersion,
          reviewStatus: 'PENDING_REVIEW'
        }
      });

      const updatedOrderRecord = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED',
          autoApproveAt
        }
      });

      await tx.notification.create({
        data: {
          userId: order.clientId,
          orderId,
          title: "Deliverable Submitted",
          message: `A freelancer has submitted delivery version ${nextVersion} for your review. The 5-day approval timer has started.`,
          type: "DELIVERABLE_SUBMITTED"
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'DELIVERABLE_SUBMITTED',
          message: `Freelancer submitted delivery version ${nextVersion}.`,
          source: 'DELIVERY_CONTROLLER',
          metadata: {
            deliverableId: createdDeliverable.id,
            version: nextVersion
          }
        }
      });

      return [createdDeliverable, updatedOrderRecord];
    });

    res.json({ message: 'Deliverable submitted. 5-day review timer started.', deliverable, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Client Requests Delivery Revision
exports.requestRevision = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Revision reason is required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw`
        SELECT * FROM "Order"
        WHERE id = ${orderId}
        FOR UPDATE
      `;

      if (!lockedOrders || lockedOrders.length === 0) {
        throw new Error('NOT_FOUND: Order not found.');
      }

      const order = lockedOrders[0];

      if (order.clientId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new Error('FORBIDDEN: Only the client can request a revision.');
      }

      if (order.status !== 'DELIVERED') {
        throw new Error('BAD_REQUEST: A revision can only be requested while a delivery is under review.');
      }

      const latestDeliverable = await tx.deliverable.findFirst({
        where: { orderId },
        orderBy: { version: 'desc' }
      });

      if (!latestDeliverable) {
        throw new Error('BAD_REQUEST: No submitted delivery exists for this order.');
      }

      const updatedDeliverable = await tx.deliverable.update({
        where: { id: latestDeliverable.id },
        data: {
          reviewStatus: 'REVISION_REQUESTED',
          revisionReason: reason.trim(),
          reviewedAt: new Date(),
          reviewedById: req.user.id
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REVISION_REQUESTED',
          autoApproveAt: null
        }
      });

      await tx.notification.create({
        data: {
          userId: order.sellerId,
          orderId,
          title: 'Revision Requested',
          message: `The client requested changes to delivery version ${latestDeliverable.version}.`,
          type: 'REVISION_REQUESTED'
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'REVISION_REQUESTED',
          message: `Client requested changes to delivery version ${latestDeliverable.version}.`,
          source: 'DELIVERY_CONTROLLER',
          metadata: {
            deliverableId: latestDeliverable.id,
            version: latestDeliverable.version,
            reason: reason.trim()
          }
        }
      });

      return { updatedOrder, updatedDeliverable };
    });

    res.json({
      message: 'Revision requested successfully.',
      order: result.updatedOrder,
      deliverable: result.updatedDeliverable
    });
  } catch (err) {
    console.error('Request Revision Error:', err);

    if (err.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: err.message.replace('NOT_FOUND: ', '') });
    }

    if (err.message.startsWith('FORBIDDEN:')) {
      return res.status(403).json({ error: err.message.replace('FORBIDDEN: ', '') });
    }

    if (err.message.startsWith('BAD_REQUEST:')) {
      return res.status(400).json({ error: err.message.replace('BAD_REQUEST: ', '') });
    }

    res.status(500).json({ error: err.message });
  }
};

// Client Approves Order & Releases Payout
exports.approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Acquire pessimistic lock on the exact row
      const lockedOrders = await tx.$queryRaw`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      if (!lockedOrders || lockedOrders.length === 0) throw new Error("Order not found");
      
      const order = lockedOrders[0];

      if (order.clientId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new Error("FORBIDDEN: Only the client can approve this order.");
      }
      if (order.status === 'COMPLETED') {
        throw new Error("BAD_REQUEST: Order is already completed.");
      }

      if (order.status !== 'DELIVERED') {
        throw new Error("BAD_REQUEST: Order cannot be approved before deliverables are submitted.");
      }

      // 2. Perform safe, locked state transitions
      const latestDeliverable = await tx.deliverable.findFirst({
        where: { orderId },
        orderBy: { version: 'desc' }
      });

      if (!latestDeliverable) {
        throw new Error("BAD_REQUEST: Order cannot be approved without a submitted delivery.");
      }

      const transferRecord = await tx.transfer.findUnique({
        where: { orderId }
      });

      if (transferRecord?.razorpayTransferId && transferRecord.onHold) {
        const releaseResult = await releaseTransfer(transferRecord);

        if (!releaseResult.released) {
          throw new Error(
            `ESCROW_RELEASE_NOT_COMPLETED: ${releaseResult.reason}`
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

      const updatedDeliverable = await tx.deliverable.update({
        where: { id: latestDeliverable.id },
        data: {
          reviewStatus: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: req.user.id
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          autoApproveAt: null
        }
      });

      if (order.jobId) {
        await tx.job.update({
          where: { id: order.jobId },
          data: {
            status: 'COMPLETED',
            isOpen: false
          }
        });
      }

      const updatedWallet = await tx.wallet.upsert({
        where: { userId: order.sellerId },
        create: { userId: order.sellerId, availableBalance: order.sellerEarnings },
        update: { availableBalance: { increment: order.sellerEarnings } }
      });

      await tx.user.update({
        where: { id: order.sellerId },
        data: { points: { increment: 50 } }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'DELIVERY_APPROVED',
          message: `Client approved delivery version ${latestDeliverable.version}.`,
          source: 'APPROVAL_CONTROLLER',
          metadata: {
            deliverableId: latestDeliverable.id,
            version: latestDeliverable.version
          }
        }
      });

      await tx.orderActivityEvent.create({
        data: {
          orderId,
          actorId: req.user.id,
          type: 'PAYMENT_RELEASED',
          message: `₹${order.sellerEarnings} released to the freelancer.`,
          source: 'APPROVAL_CONTROLLER',
          metadata: {
            amount: order.sellerEarnings,
            deliveryVersion: latestDeliverable.version
          }
        }
      });

      await tx.notification.create({
        data: {
          userId: order.sellerId,
          orderId,
          title: "Order Approved",
          message: `Your order has been approved and ₹${order.sellerEarnings} has been added to your wallet.`,
          type: "ORDER_APPROVED"
        }
      });

      return {
        updatedOrder,
        updatedDeliverable,
        updatedWallet,
        sellerEarnings: order.sellerEarnings
      };
    }, { maxWait: 2000, timeout: 5000 });

    res.json({ 
      message: 'Order approved! ₹' + result.sellerEarnings + ' released to student wallet.', 
      order: result.updatedOrder, 
      wallet: result.updatedWallet,
      deliverable: result.updatedDeliverable
    });
  } catch (err) {
    if (err.message.includes('FORBIDDEN')) return res.status(403).json({ error: err.message.replace('FORBIDDEN: ', '') });
    if (err.message.includes('BAD_REQUEST')) return res.status(400).json({ error: err.message.replace('BAD_REQUEST: ', '') });
    res.status(500).json({ error: err.message });
  }
};

// Get Order Messages
exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;

    const authBoundary = req.user?.role === 'ADMIN'
    ? { id: orderId } 
    : { id: orderId, OR: [{ clientId: req.user.id }, { sellerId: req.user.id }] };

  const order = await prisma.order.findFirst({
    where: authBoundary
  });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.clientId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send Message
exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { content, fileUrl } = req.body;

    if (!content?.trim() && !fileUrl?.trim()) {
      return res.status(400).json({ error: 'Message or attachment required' });
    }

    if (fileUrl && typeof fileUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid attachment URL' });
    }

    const authBoundary = req.user?.role === 'ADMIN'
    ? { id: orderId } 
    : { id: orderId, OR: [{ clientId: req.user.id }, { sellerId: req.user.id }] };

  const order = await prisma.order.findFirst({
    where: authBoundary
  });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isClient = order.clientId === req.user.id;
    const isSeller = order.sellerId === req.user.id;

    if (!isClient && !isSeller) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recipientId = isClient
      ? order.sellerId
      : order.clientId;

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: req.user.id,
        recipientId,
        content: content?.trim() || '',
        fileUrl: fileUrl?.trim() || null
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${orderId}`).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

