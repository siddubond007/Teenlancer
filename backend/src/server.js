const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const prisma = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const gigCustomOfferRoutes = require('./routes/gigCustomOfferRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const jobRoutes = require('./routes/jobRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const resumableUploadRoutes = require('./routes/resumableUploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const clientDashboardRoutes = require('./routes/clientDashboardRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { moderateMessage } = require('./services/moderationService');
const { startEscrowReleaseWorker } = require('./workers/escrowReleaseWorker');

const app = express();
const server = http.createServer(app);
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean));

const isAllowedDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production' || !origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    const isPrivateIpv4 =
      /^10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}$/.test(hostname) ||
      /^192\.168\.(?:[0-9]{1,3})\.(?:[0-9]{1,3})$/.test(hostname) ||
      /^172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3}$/.test(hostname);

    return (url.protocol === 'http:' && isPrivateIpv4 &&
      (url.port === '5173' || url.port === '5174'));
  } catch {
    return false;
  }
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Socket origin not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('API origin not allowed'));
  },
  credentials: true
}));

// 🛡️ OWASP Security Headers (crossOriginResourcePolicy: false allows serving static upload images)
app.use(helmet({ crossOriginResourcePolicy: false }));

// 🛡️ OWASP Rate Limiting to prevent Brute Force & DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit repeated failed authentication attempts
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many failed authentication attempts. Please try again later.' }
});

// Apply rate limiters
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);


// TEMP REQUEST DEBUG LOGGER
app.use((req, res, next) => {
  console.log('📥 REQUEST:', req.method, req.originalUrl);
  console.log('🔐 AUTH:', req.headers.authorization ? 'Bearer token present' : 'NO AUTH TOKEN');
  next();
});
// 🛡️ CRITICAL: Webhooks must use raw buffer to mathematically verify Razorpay signatures
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/gig-custom-offers', gigCustomOfferRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload/resumable', resumableUploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/client/dashboard', clientDashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marketplace API running smoothly.' });
});

// Socket.io Realtime Chat
const jwt = require('jsonwebtoken');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isSuspended: true,
        suspendedUntil: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.isSuspended) {
      return next(new Error('Account suspended'));
    }

    if (
      user.suspendedUntil &&
      new Date(user.suspendedUntil) > new Date()
    ) {
      return next(new Error('Account temporarily suspended'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid or expired session'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;

  socket.join(`user_${userId}`);

  socket.on('join_order_room', async (orderId) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        return socket.emit('order_room_denied', {
          error: 'Invalid order reference.'
        });
      }

      const order = await prisma.order.findFirst({
        where:
          socket.user.role === 'ADMIN'
            ? { id: orderId }
            : {
                id: orderId,
                OR: [
                  { clientId: socket.user.id },
                  { sellerId: socket.user.id }
                ]
              },
        select: {
          id: true
        }
      });

      if (!order) {
        return socket.emit('order_room_denied', {
          error: 'You are not authorized to access this order.'
        });
      }

      socket.join(`order_${orderId}`);

      socket.emit('order_room_joined', { orderId });
    } catch (error) {
      console.error('Socket order room authorization error:', error.message);
      socket.emit('order_room_denied', {
        error: 'Unable to authorize this order.'
      });
    }
  });

  socket.on('send_chat_message', async (data) => {
    try {
      const {
        orderId,
        content,
        fileUrl
      } = data || {};

      if (!orderId || typeof orderId !== 'string') {
        return socket.emit('message_error', {
          error: 'Invalid order reference.'
        });
      }

      const order = await prisma.order.findFirst({
        where:
          socket.user.role === 'ADMIN'
            ? { id: orderId }
            : {
                id: orderId,
                OR: [
                  { clientId: socket.user.id },
                  { sellerId: socket.user.id }
                ]
              },
        select: {
          id: true,
          clientId: true,
          sellerId: true
        }
      });

      if (!order) {
        return socket.emit('message_error', {
          error: 'You are not authorized to message this order.'
        });
      }

      const recipientId =
        socket.user.id === order.clientId
          ? order.sellerId
          : order.clientId;

      const safeContent =
        typeof content === 'string' ? content.trim() : '';

      const safeFileUrl =
        typeof fileUrl === 'string' && fileUrl.trim()
          ? fileUrl.trim()
          : null;

      if (!safeContent && !safeFileUrl) {
        return socket.emit('message_error', {
          error: 'Message or attachment required.'
        });
      }

      const check = await moderateMessage(safeContent);

      if (!check.isAllowed) {
        await prisma.moderationLog.create({
          data: {
            senderId: socket.user.id,
            flaggedText: safeContent,
            violationType: check.reason,
            confidence: 0.95
          }
        });

        return socket.emit('message_blocked', {
          warning: check.warning,
          blockedText: safeContent
        });
      }

      const message = await prisma.message.create({
        data: {
          orderId,
          senderId: socket.user.id,
          recipientId,
          content: safeContent,
          fileUrl: safeFileUrl
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });

      io.to(`order_${orderId}`).emit('new_message', message);
    } catch (error) {
      console.error('Socket message error:', error.message);
      socket.emit('message_error', {
        error: 'Failed to send message.'
      });
    }
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

startEscrowReleaseWorker();

server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
