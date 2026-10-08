const Razorpay = require('razorpay');

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
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

  const remoteTransfer = await razorpay.transfers.fetch(
    transferRecord.razorpayTransferId
  );

  if (remoteTransfer?.on_hold === true) {
    await razorpay.transfers.edit(
      transferRecord.razorpayTransferId,
      { on_hold: false }
    );
  }

  return {
    released: remoteTransfer?.on_hold !== true,
    razorpayTransferId: transferRecord.razorpayTransferId
  };
}

module.exports = {
  releaseTransfer
};
