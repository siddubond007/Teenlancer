const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/razorpay', webhookController.handleRazorpayWebhook);

module.exports = router;
