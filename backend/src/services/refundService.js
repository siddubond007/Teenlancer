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

async function refundPayment(paymentId, amountInr) {
  if (!paymentId) {
    throw new Error('PAYMENT_REFERENCE_MISSING');
  }

  const amount = Math.round(Number(amountInr) * 100);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('REFUND_AMOUNT_INVALID');
  }

  const razorpay = getRazorpayClient();

  return razorpay.payments.refund(paymentId, {
    amount
  });
}

module.exports = {
  refundPayment
};
