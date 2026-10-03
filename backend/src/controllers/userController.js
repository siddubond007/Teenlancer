const prisma = require('../config/db');

function sanitizePublicProfile(profile) {
  if (!profile) return profile;

  const {
    resumeUrl: _resumeUrl,
    resumeFileName: _resumeFileName,
    onboardingData,
    ...publicProfile
  } = profile;

  if (!onboardingData || typeof onboardingData !== 'object' || Array.isArray(onboardingData)) {
    return publicProfile;
  }

  const {
    version,
    role,
    primaryDomain,
    selectedSkills,
    academicStatus,
    graduationYear,
    availability,
    companyOrProjectName
  } = onboardingData;

  return {
    ...publicProfile,
    onboardingData: {
      version,
      role,
      primaryDomain,
      selectedSkills,
      academicStatus,
      graduationYear,
      availability,
      companyOrProjectName
    }
  };
}

exports.getFreelancers = async (req, res) => {
  try {
    const { category } = req.query;
    let whereClause = {
      role: 'STUDENT_FREELANCER',
      isSuspended: false
    };

    if (category && category !== 'all') {
      const cleanCategory = category.replace(/-/g, ' ');
      whereClause.profile = {
        category: { contains: cleanCategory, mode: 'insensitive' }
      };
    }

    const freelancers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        age: true,
        points: true,
        createdAt: true,
        profile: true,
        reviewsReceived: { select: { overallRating: true, comment: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const safeFreelancers = freelancers.map((freelancer) => ({
      ...freelancer,
      profile: sanitizePublicProfile(freelancer.profile)
    }));

    res.json(safeFreelancers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        gigs: { include: { packages: true } },
        reviewsReceived: {
          where: { isVisible: true },
          include: {
            reviewer: { select: { fullName: true } }
          }
        },
        verification: true,
        ordersAsSeller: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            sellerEarnings: true,
            createdAt: true,
            deadline: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Your profile was not found.' });
    }

    delete user.passwordHash;

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId },
          { email: userId }
        ]
      },
      include: {
        profile: true,
        gigs: { include: { packages: true } },
        reviewsReceived: {
            where: { isVisible: true },
            include: {
              reviewer: { select: { fullName: true } }
            }
          },
        verification: true,
        ordersAsSeller: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            sellerEarnings: true,
            createdAt: true,
            deadline: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    delete user.passwordHash;
    delete user.verification;
    delete user.ordersAsSeller;

    user.profile = sanitizePublicProfile(user.profile);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { 
      tagline, bio, college, category, hourlyRate, skills, avatarUrl, coverUrl,
      experienceList, educationList, qualificationList, certificationList, socialLinks,
      responseTimeExpectation, githubUrl, youtubeUrl, drivePortfolio,
      onboardingCompleted, onboardingStatus, onboardingData
    } = req.body;

    const allowedOnboardingStatuses = new Set([
      'NOT_STARTED',
      'PENDING',
      'IN_PROGRESS',
      'SKIPPED',
      'COMPLETED'
    ]);

    let normalizedOnboardingStatus;
    if (onboardingStatus !== undefined) {
      normalizedOnboardingStatus = String(onboardingStatus).trim().toUpperCase();
      if (!allowedOnboardingStatuses.has(normalizedOnboardingStatus)) {
        return res.status(400).json({
          error: 'Invalid onboarding status.'
        });
      }
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        tagline: tagline || '',
        bio: bio || '',
        college: college || '',
        category: category || 'Graphic Design',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 499,
        skills: skills || ['Student Talent'],
        avatarUrl,
        coverUrl,
        githubUrl,
        youtubeUrl,
        drivePortfolio,
        experienceList: experienceList || [],
        educationList: educationList || [],
        qualificationList: qualificationList || [],
        certificationList: certificationList || [],
        socialLinks: socialLinks || {},
        responseTimeExpectation: typeof responseTimeExpectation === 'string'
          ? responseTimeExpectation.trim().slice(0, 120) || null
          : null,
        onboardingCompleted: normalizedOnboardingStatus !== undefined
          ? normalizedOnboardingStatus === 'COMPLETED'
          : (onboardingCompleted !== undefined
              ? (onboardingCompleted === true || onboardingCompleted === 'true')
              : true),
        onboardingStatus: normalizedOnboardingStatus
          || (onboardingCompleted === false || onboardingCompleted === 'false' ? 'PENDING' : 'COMPLETED'),
        onboardingData: onboardingData !== undefined ? onboardingData : {}
      },
      update: {
        tagline,
        bio,
        college,
        category,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        skills: skills ? skills : undefined,
        avatarUrl,
        coverUrl,
        githubUrl,
        youtubeUrl,
        drivePortfolio,
        experienceList: experienceList !== undefined ? experienceList : undefined,
        educationList: educationList !== undefined ? educationList : undefined,
        qualificationList: qualificationList !== undefined ? qualificationList : undefined,
        certificationList: certificationList !== undefined ? certificationList : undefined,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        responseTimeExpectation: responseTimeExpectation !== undefined
          ? (typeof responseTimeExpectation === 'string'
              ? responseTimeExpectation.trim().slice(0, 120) || null
              : null)
          : undefined,
        onboardingCompleted: normalizedOnboardingStatus !== undefined
          ? normalizedOnboardingStatus === 'COMPLETED'
          : (onboardingCompleted !== undefined
              ? (onboardingCompleted === true || onboardingCompleted === 'true')
              : undefined),
        onboardingStatus: normalizedOnboardingStatus !== undefined
          ? normalizedOnboardingStatus
          : undefined,
        onboardingData: onboardingData !== undefined ? onboardingData : undefined
      }
    });

    res.json({ message: 'Profile updated successfully!', profile: updatedProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPortfolioItem = async (req, res) => {
  try {
    const { title, category, img, link } = req.body;
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    
    const currentItems = Array.isArray(profile.portfolioItems) ? profile.portfolioItems : [];
    const newItem = { id: Date.now(), title, category, img, link };
    const updatedItems = [newItem, ...currentItems];

    await prisma.profile.update({
      where: { userId: req.user.id },
      data: { portfolioItems: updatedItems }
    });

    res.status(201).json({ message: 'Portfolio item added successfully!', portfolioItems: updatedItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Allows submitting either College ID or Government Identity ID independently
exports.submitVerification = async (req, res) => {
  try {
    const { idCardUrl, collegeName, educationType, nationalIdUrl } = req.body;
    if (!idCardUrl && !nationalIdUrl) {
      return res.status(400).json({ error: 'Please upload either your College Student ID or Government ID document.' });
    }

    const updateData = {
      reviewedAt: null
    };

    if (idCardUrl) {
      updateData.idCardUrl = idCardUrl;
      updateData.collegeIdStatus = 'PENDING';
      updateData.collegeRejectionReason = null;
    }
    if (nationalIdUrl) {
      updateData.nationalIdUrl = nationalIdUrl;
      updateData.govtIdStatus = 'PENDING';
      updateData.govtRejectionReason = null;
    }
    if (collegeName) updateData.collegeName = collegeName;
    if (educationType) updateData.educationType = educationType;

    const verification = await prisma.verificationRequest.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        idCardUrl: idCardUrl || null,
        collegeIdStatus: idCardUrl ? 'PENDING' : 'PENDING',
        nationalIdUrl: nationalIdUrl || null,
        govtIdStatus: nationalIdUrl ? 'PENDING' : 'PENDING',
        collegeName: collegeName || '',
        educationType: educationType || 'COLLEGE',
        status: 'PENDING'
      },
      update: updateData
    });

    res.status(201).json({ message: 'Verification document submitted successfully for review.', verification });
  } catch (err) {
    console.error('Submit verification error:', err);
    res.status(500).json({ error: err.message });
  }
};
