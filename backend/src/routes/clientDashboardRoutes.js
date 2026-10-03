const express = require('express');
const router = express.Router();

const clientDashboardController = require('../controllers/clientDashboardController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.get('/', requireAuth, clientDashboardController.getClientDashboard);

module.exports = router;
