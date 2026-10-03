const express = require('express');
const router = express.Router();

const disputeController = require('../controllers/disputeController');
const {
  requireAuth,
  requireAdmin
} = require('../middlewares/authMiddleware');

router.post('/', requireAuth, disputeController.createDispute);
router.get('/my', requireAuth, disputeController.getMyDisputes);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  disputeController.getAllDisputes
);

router.put(
  '/:id/resolve',
  requireAuth,
  requireAdmin,
  disputeController.resolveDispute
);

module.exports = router;
