const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const prisma = require('../config/db');

async function createAdminLoginLog(adminId, email, ipAddress, userAgent, loginStatus) {
  try {
    await prisma.adminLoginLog.create({
      data: {
        adminId,
        email,
        ipAddress,
        userAgent,
        loginStatus
      }
    });
  } catch (err) {
    console.error('AdminLoginLog Error:', err);
  }
}

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);

// Direct Master Admin Unlock with Master Key
router.post('/admin-login', async (req, res) => {
  try {
    const { masterKey } = req.body;

    if (masterKey !== 'admin2026') {
      await createAdminLoginLog(
        null,
        'admin@skilllaunch.com',
        req.ip,
        req.headers['user-agent'],
        'FAILED_MASTER_KEY'
      );

      return res.status(403).json({ error: 'Incorrect Master Admin Key. Access denied.' });
    }

    const passwordHash = await bcrypt.hash('adminpassword123', 10);

    // Upsert Root Super Administrator
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@skilllaunch.com' },
      update: { role: 'ADMIN' },
      create: {
        username: 'superadmin',
        email: 'admin@skilllaunch.com',
        passwordHash,
        firstName: 'Master',
        lastName: 'Admin',
        fullName: 'Platform Administrator',
        role: 'ADMIN',
        age: 26,
        profile: {
          create: {
            tagline: 'Root System Administrator',
            bio: 'Master Platform Administrator for SkillLaunch.'
          }
        },
        wallet: { create: {} }
      },
      include: { profile: true, wallet: true }
    });

    const token = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    await prisma.adminLoginLog.create({
      data: {
        adminId: adminUser.id,
        email: adminUser.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginStatus: 'SUCCESS'
      }
    });

    res.json({ message: 'Master Admin Access Granted', token, user: adminUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
