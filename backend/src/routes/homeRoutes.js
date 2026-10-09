const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/authMiddleware');
const homeController = require('../controllers/homeController');
const homeDiscoveryController = require('../controllers/homeDiscoveryController');
const homeAnalyticsController = require('../controllers/homeAnalyticsController');

router.get('/state', requireAuth, homeController.getHomeState);
router.get('/discovery', requireAuth, homeDiscoveryController.getHomeDiscovery);
router.get('/profile-nudges', requireAuth, homeDiscoveryController.getProfileNudges);
router.get('/analytics', requireAuth, homeAnalyticsController.getHomeAnalytics);

module.exports = router;
