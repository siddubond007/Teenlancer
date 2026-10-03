const express = require('express');
const router = express.Router();

const gigCustomOfferController = require('../controllers/gigCustomOfferController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', gigCustomOfferController.getMyOffers);
router.post('/', gigCustomOfferController.createOffer);
router.post('/:offerId/respond', gigCustomOfferController.respondToOffer);
router.post('/:offerId/accept', gigCustomOfferController.acceptOffer);

module.exports = router;
