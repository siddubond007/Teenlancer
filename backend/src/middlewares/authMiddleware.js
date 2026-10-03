const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    
    // Clean string token extraction (removes 'Bearer ')
    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // SECURITY UPGRADE: Prevent database crashing by only fetching essential auth data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isSuspended: true,
        suspendedUntil: true
      }
    });

    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (user.isSuspended) return res.status(403).json({ error: 'Your account has been permanently suspended.' });
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res.status(403).json({ error: `Account suspended due to platform violations until ${new Date(user.suspendedUntil).toLocaleString()}` });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: 'Invalid or expired session: ' + err.message });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access Denied: 403 Forbidden. Administrator privileges required.' });
  }
  next();
};


exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Public requests remain anonymous and continue normally.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isSuspended: true,
        suspendedUntil: true
      }
    });

    if (!user || user.isSuspended) {
      req.user = null;
      return next();
    }

    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    // Invalid/expired optional credentials must not break public job viewing.
    req.user = null;
    next();
  }
};
