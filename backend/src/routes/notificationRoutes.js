const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/stats', notificationController.getNotificationStats);
router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:notificationId/read', notificationController.markAsRead);

module.exports = router;
