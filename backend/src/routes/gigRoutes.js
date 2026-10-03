const express = require('express');
const router = express.Router();
const gigController = require('../controllers/gigController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');

router.get('/', gigController.getGigs);
router.get('/mine', requireAuth, gigController.getMyGigs);
router.get('/drafts/:gigId', requireAuth, gigController.getGigDraft);
router.post('/drafts', requireAuth, gigController.createGigDraft);
router.put('/drafts/:gigId', requireAuth, gigController.updateGigDraft);
router.post('/drafts/:gigId/submit', requireAuth, gigController.submitGigDraft);
router.put('/:gigId/lifecycle', requireAuth, gigController.updateGigLifecycle);
router.put('/:gigId/availability', requireAuth, gigController.updateGigAvailability);
router.post('/:gigId/duplicate', requireAuth, gigController.duplicateGig);
router.get('/:gigId/revisions', requireAuth, gigController.getGigRevisions);
router.get('/:gigId/manage', requireAuth, gigController.getGigForManagement);
router.put('/:gigId/manage', requireAuth, gigController.updateGigForManagement);
router.post('/:gigId/manage/submit', requireAuth, gigController.submitGigManagementEdit);
router.post('/:gigId/analytics', optionalAuth, gigController.recordGigAnalytics);
router.post('/:gigId/favorite', requireAuth, gigController.toggleGigFavorite);
router.get('/:gigId/analytics', requireAuth, gigController.getGigAnalytics);
router.get('/:gigId', optionalAuth, gigController.getGigById);
router.post('/', requireAuth, gigController.createGig);

module.exports = router;
