const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/authMiddleware');
const homeController = require('../controllers/homeController');

router.get('/state', requireAuth, homeController.getHomeState);

module.exports = router;
