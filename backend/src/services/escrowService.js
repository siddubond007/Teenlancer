const Razorpay = require('razorpay');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

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

  const razorpay = getRazorpayClient();

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
