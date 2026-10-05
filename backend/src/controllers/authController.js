const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured.');
}

const MIN_REGISTRATION_AGE = 16;

function parseDateOfBirthAndAge(dobString) {
  if (typeof dobString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return null;
  }

  const [year, month, day] = dobString.split('-').map(Number);
  const dobDate = new Date(Date.UTC(year, month - 1, day));

  if (
    dobDate.getUTCFullYear() !== year ||
    dobDate.getUTCMonth() !== month - 1 ||
    dobDate.getUTCDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - year;

  const birthdayPassed =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);

  if (!birthdayPassed) {
    age -= 1;
  }

  if (dobDate > today || age < 0 || age > 120) {
    return null;
  }

  return { dobDate, age };
}

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


exports.register = async (req, res) => {
  try {
    const { email, password, firstName, middleName, lastName, username, role, dob } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Please provide first name, last name, email, and password.' });
    }

    const passwordIsStrong =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password) &&
      !/\s/.test(password);

    if (!passwordIsStrong) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character, with no spaces.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (existingEmail) {
      return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
    }

    const userCleanName = (username || `${firstName.toLowerCase()}${Math.floor(100 + Math.random() * 900)}`).replace(/\s+/g, '');

    const existingUsername = await prisma.user.findFirst({
      where: { username: { equals: userCleanName, mode: 'insensitive' } }
    });
    if (existingUsername) {
      return res.status(409).json({ error: 'This username is already taken. Please choose a different username.' });
    }

    const parsedDob = parseDateOfBirthAndAge(dob);

    if (!parsedDob) {
      return res.status(400).json({
        error: 'Please provide a valid date of birth in YYYY-MM-DD format.'
      });
    }

    const { dobDate, age: parsedAge } = parsedDob;

    if (parsedAge < MIN_REGISTRATION_AGE) {
      return res.status(403).json({
        error: 'You must be at least 16 years old to register on SkillLaunch.'
      });
    }

    const isMinor = parsedAge < 18;

    // Public registration may create only supported non-admin account types.
    // Administrator accounts must not be selectable through the public signup API.
    const normalizedRole = String(role || 'STUDENT_FREELANCER').trim().toUpperCase();
    const allowedPublicRoles = new Set(['STUDENT_FREELANCER', 'CLIENT']);

    if (!allowedPublicRoles.has(normalizedRole)) {
      return res.status(403).json({ error: 'Invalid account role. Public registration supports Student or Client accounts only.' });
    }

    // Indian Contract Act Sec 11 Safeguard
    const requestedRole = normalizedRole;
    if (isMinor && requestedRole === 'CLIENT') {
      return res.status(403).json({ error: 'Legal Capacity Error: Users under 18 cannot legally enter into employment contracts or act as a Client.' });
    }
    const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

    const user = await prisma.user.create({
      data: {
        username: userCleanName,
        email: cleanEmail,
        passwordHash,
        firstName,
        middleName: middleName || null,
        lastName,
        fullName,
        role: isMinor ? 'STUDENT_FREELANCER' : normalizedRole,
        isMinor,
        age: parsedAge,
        dob: dobDate,
        profile: {
          create: {
            tagline: isMinor ? 'Young Student Creator (Minor Verified)' : 'Student Creator & Freelancer',
            bio: 'Student Fresher ready to deliver quality work and build a verified portfolio.',
            college: '',
            category: 'General Freelancing',
            hourlyRate: 350,
            skills: ['Student Talent', 'Fast Learner'],
            onboardingCompleted: false,
            onboardingStatus: 'PENDING',
            onboardingData: {}
          }
        },
        wallet: { create: { isParentAccount: isMinor, availableBalance: 0 } }
      },
      include: { profile: true, wallet: true }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("Register Error:", err);

    if (err?.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : '';
      if (target.toLowerCase().includes('email')) {
        return res.status(409).json({
          error: 'This email is already registered. Please sign in instead.'
        });
      }
      if (target.toLowerCase().includes('username')) {
        return res.status(409).json({
          error: 'This username is already taken. Please choose a different username.'
        });
      }
      return res.status(409).json({
        error: 'Some account details are already in use. Please choose different details.'
      });
    }

    res.status(500).json({ error: 'Unable to create the account right now. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanInput = email.trim();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: 'insensitive' } },
          { username: { equals: cleanInput, mode: 'insensitive' } }
        ]
      },
      include: { profile: true, wallet: true, verification: true }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email or username. Please sign up.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      if (user.role === 'ADMIN') {
        await createAdminLoginLog(
          user.id,
          user.email,
          req.ip,
          req.headers['user-agent'],
          'FAILED_BAD_PASSWORD'
        );
      }

      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    if (user.role === 'ADMIN') {
      await createAdminLoginLog(
        user.id,
        user.email,
        req.ip,
        req.headers['user-agent'],
        'SUCCESS'
      );
    }

    console.log(`✅ Login successful: ${user.email} -> Role: ${user.role}`);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Database Error: ' + err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
