const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_for_dev',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

async function releaseTransfer(transferRecord) {
  if (!transferRecord) {
    return {
      released: false,
      reason: 'NO_TRANSFER_RECORD'
    };
  }

  if (!transferRecord.razorpayTransferId) {
    return {
      released: false,
      reason: 'NO_RAZORPAY_TRANSFER_ID'
    };
  }

  if (!transferRecord.onHold || transferRecord.status === 'RELEASED') {
    return {
      released: false,
      reason: 'ALREADY_RELEASED'
    };
  }

  await razorpay.transfers.edit(
    transferRecord.razorpayTransferId,
    { on_hold: false }
  );

  return {
    released: true,
    razorpayTransferId: transferRecord.razorpayTransferId
  };
}

module.exports = {
  releaseTransfer
};
