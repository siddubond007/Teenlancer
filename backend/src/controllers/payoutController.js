const prisma = require('../config/db');

exports.createPayoutRequest = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const withdrawAmount = Number(amount);

    if (withdrawAmount < 100) return res.status(400).json({ error: 'Minimum withdrawal is ₹100.' });

    const payout = await prisma.$transaction(async (tx) => {
      // 1. Acquire pessimistic lock on the user's wallet
      const lockedWallets = await tx.$queryRaw`SELECT * FROM "Wallet" WHERE "userId" = ${req.user.id} FOR UPDATE`;
      if (!lockedWallets || lockedWallets.length === 0) throw new Error("Wallet not found.");
      
      const wallet = lockedWallets[0];

      // 2. Validate balance strictly under lock
      if (wallet.availableBalance < withdrawAmount) {
        throw new Error("BAD_REQUEST: Insufficient wallet balance.");
      }

      // 3. Process withdrawal safely
      await tx.wallet.update({
        where: { userId: req.user.id },
        data: {
          availableBalance: { decrement: withdrawAmount },
          pendingBalance: { increment: withdrawAmount }
        }
      });

      return tx.payoutRequest.create({
        data: {
          userId: req.user.id,
          amount: withdrawAmount,
          method: 'UPI',
          destination: upiId
        }
      });
    }, { maxWait: 2000, timeout: 5000 });

    res.status(201).json({ message: 'Withdrawal request submitted successfully.', payout });
  } catch (err) {
    if (err.message.includes('BAD_REQUEST')) return res.status(400).json({ error: err.message.replace('BAD_REQUEST: ', '') });
    res.status(500).json({ error: err.message });
  }
};

exports.getMyPayoutRequests = async (req, res) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      where: {
        userId: req.user.id
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


exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: req.user.id
      },
      select: {
        availableBalance: true,
        pendingBalance: true,
        upiId: true
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
