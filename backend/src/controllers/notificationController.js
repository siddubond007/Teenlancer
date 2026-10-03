const prisma = require('../config/db');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const stats = {
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount
    };

    res.json({
      notifications,
      stats
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id: notificationId
      },
      data: {
        isRead: true
      }
    });

    res.json(notification);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.getNotificationStats = async (req, res) => {
  try {
    const total = await prisma.notification.count({
      where: {
        userId: req.user.id
      }
    });

    const unread = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({
      total,
      unread,
      read: total - unread
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
