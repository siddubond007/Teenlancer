const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

// Lock ALL routes below behind JWT Authentication + Strict ADMIN Role Gate
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getStats);
router.get('/moderation-logs', adminController.getModerationLogs);
router.get('/gig-moderation', adminController.getGigModerationQueue);
router.put('/gig-moderation/:gigId', adminController.updateGigModerationStatus);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/export', adminController.exportAuditLogs);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/suspend', adminController.toggleSuspend);
router.put('/users/:userId/role', adminController.changeUserRole);

router.get('/verifications', adminController.getVerifications);
router.put('/verifications/:id/status', adminController.updateVerificationStatus);

router.get('/payouts', adminController.getPayoutRequests);
router.put('/payouts/:payoutId/approve', adminController.approvePayoutRequest);
router.put('/payouts/:payoutId/reject', adminController.rejectPayoutRequest);


router.get('/fraud', adminController.getFraudDashboard);
router.get('/fraud-investigation/:userId', adminController.getFraudInvestigationReport);

router.post('/fraud-investigation/:userId/note', adminController.addInvestigationNote);
router.get('/fraud-investigation/:userId/history', adminController.getInvestigationHistory);
router.post('/fraud-investigation/:userId/ban', adminController.banUser);
router.post('/fraud-investigation/:userId/clear', adminController.clearInvestigation);
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:reviewId/hide', adminController.hideReview);
router.put('/reviews/:reviewId/show', adminController.showReview);
router.put('/reviews/:reviewId/flag', adminController.flagReview);
router.delete('/reviews/:reviewId', adminController.deleteReview);

module.exports = router;

