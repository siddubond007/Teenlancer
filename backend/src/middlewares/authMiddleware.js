const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured.');
}
const prisma = require('../config/db');
const { getAuthToken } = require('../utils/authCookie');

exports.requireAuth = async (req, res, next) => {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // SECURITY UPGRADE: Prevent database crashing by only fetching essential auth data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        fullName: true,
        role: true,
        isMinor: true,
        age: true,
        dob: true,
        isDeleted: true,
        isSuspended: true,
        suspendedUntil: true,
        isBanned: true
      }
    });

    if (!user || user.isDeleted) return res.status(401).json({ error: 'User account is no longer available.' });
    if (user.isBanned) return res.status(403).json({ error: 'Your account has been banned from the platform.' });
    if (user.isSuspended) return res.status(403).json({ error: 'Your account has been permanently suspended.' });
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res.status(403).json({ error: `Account suspended due to platform violations until ${new Date(user.suspendedUntil).toLocaleString()}` });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: 'Invalid or expired session.' });
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
    const token = getAuthToken(req);

    // Public requests remain anonymous and continue normally.
    if (!token) {
      req.user = null;
      return next();
    }
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        fullName: true,
        role: true,
        isMinor: true,
        age: true,
        dob: true,
        isDeleted: true,
        isSuspended: true,
        suspendedUntil: true,
        isBanned: true
      }
    });

    if (!user || user.isDeleted || user.isSuspended || user.isBanned) {
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
