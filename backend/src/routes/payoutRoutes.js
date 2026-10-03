const express = require('express');
const router = express.Router();

const payoutController = require('../controllers/payoutController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/', requireAuth, payoutController.createPayoutRequest);
router.get('/my', requireAuth, payoutController.getMyPayoutRequests);
router.get('/wallet', requireAuth, payoutController.getMyWallet);

module.exports = router;
