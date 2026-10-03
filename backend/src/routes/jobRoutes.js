const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');

router.get('/', jobController.getJobs);
router.get('/my-drafts', requireAuth, jobController.getMyDrafts);
router.get('/my-projects', requireAuth, jobController.getMyProjects);
router.get('/public/:jobId', optionalAuth, jobController.getPublicJobById);
router.get('/:jobId', requireAuth, jobController.getJobById);
router.post('/', requireAuth, jobController.createJob);
router.put('/:jobId', requireAuth, jobController.updateJob);
router.delete('/:jobId', requireAuth, jobController.deleteJob);
router.post('/:jobId/bid', requireAuth, jobController.submitBid);

router.post('/:jobId/accept-bid/:bidId', requireAuth, jobController.acceptBid);
router.post('/:jobId/cancel-hiring', requireAuth, jobController.cancelHiring);
router.post('/:jobId/shortlist-bid/:bidId', requireAuth, jobController.shortlistBid);
router.post('/:jobId/reject-bid/:bidId', requireAuth, jobController.rejectBid);
module.exports = router;

