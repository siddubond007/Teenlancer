const prisma = require('../config/db');

function sanitizePublicProfile(profile) {
  if (!profile) return profile;

  const {
    id,
    tagline,
    bio,
    avatarUrl,
    coverUrl,
    college,
    category,
    hourlyRate,
    githubUrl,
    youtubeUrl,
    drivePortfolio,
    skills,
    badges,
    canUseTieredGigs,
    responseTimeExpectation,
    portfolioItems,
    experienceList,
    educationList,
    qualificationList,
    certificationList,
    socialLinks,
    onboardingData
  } = profile;

  const safeProfile = {
    id,
    tagline,
    bio,
    avatarUrl,
    coverUrl,
    college,
    category,
    hourlyRate,
    githubUrl,
    youtubeUrl,
    drivePortfolio,
    skills,
    badges,
    canUseTieredGigs,
    responseTimeExpectation,
    portfolioItems,
    experienceList,
    educationList,
    qualificationList,
    certificationList,
    socialLinks
  };

  if (!onboardingData || typeof onboardingData !== 'object' || Array.isArray(onboardingData)) {
    return safeProfile;
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
    ...safeProfile,
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
      isSuspended: false,
      isBanned: false,
      isDeleted: false
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
        points: true,
        createdAt: true,
        profile: true,
        reviewsReceived: {
          where: { isVisible: true },
          select: { overallRating: true, comment: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const safeFreelancers = freelancers.map((freelancer) => ({
      ...freelancer,
      profile: sanitizePublicProfile(freelancer.profile)
    }));

    res.json(safeFreelancers);
  } catch (err) {
    res.status(500).json({ error: 'Request could not be completed.' });
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
    return res.status(500).json({ error: 'Request could not be completed.' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId }
        ],
        isBanned: false,
        isSuspended: false,
        isDeleted: false
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        points: true,
        createdAt: true,
        profile: true,
        gigs: { include: { packages: true } },
        reviewsReceived: {
          where: { isVisible: true },
          include: {
            reviewer: { select: { fullName: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    user.profile = sanitizePublicProfile(user.profile);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Request could not be completed.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { 
      tagline, bio, college, category, hourlyRate, skills, avatarUrl, coverUrl,
      experienceList, educationList, qualificationList, certificationList, socialLinks,
      responseTimeExpectation, githubUrl, youtubeUrl, drivePortfolio
    } = req.body;

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
        // Onboarding state is server-controlled and is initialized safely for new profiles.
        onboardingCompleted: false,
        onboardingStatus: 'PENDING',
        onboardingData: {}
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
        // Do not accept onboarding completion/status/data from the generic profile editor.
        // Trusted onboarding endpoints can update these fields explicitly.
      }
    });

    res.json({ message: 'Profile updated successfully!', profile: updatedProfile });
  } catch (err) {
    res.status(500).json({ error: 'Request could not be completed.' });
  }
};

exports.updateOnboarding = async (req, res) => {
  try {
    const {
      tagline,
      bio,
      category,
      skills,
      avatarUrl,
      responseTimeExpectation,
      githubUrl,
      youtubeUrl,
      drivePortfolio,
      onboardingCompleted,
      onboardingStatus,
      onboardingData
    } = req.body || {};

    const role = req.user.role;
    if (role !== 'STUDENT_FREELANCER' && role !== 'CLIENT') {
      return res.status(403).json({
        error: 'This account type does not use onboarding.'
      });
    }

    const normalizedStatus = String(onboardingStatus || '').trim().toUpperCase();
    if (!['COMPLETED', 'SKIPPED'].includes(normalizedStatus)) {
      return res.status(400).json({
        error: 'onboardingStatus must be COMPLETED or SKIPPED.'
      });
    }

    if (onboardingCompleted !== (normalizedStatus === 'COMPLETED')) {
      return res.status(400).json({
        error: 'onboardingCompleted does not match onboardingStatus.'
      });
    }

    if (
      !onboardingData ||
      typeof onboardingData !== 'object' ||
      Array.isArray(onboardingData)
    ) {
      return res.status(400).json({
        error: 'onboardingData must be a JSON object.'
      });
    }

    const cleanString = (value, maxLength) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed ? trimmed.slice(0, maxLength) : null;
    };

    const cleanUrl = (value, maxLength) => {
      const trimmed = cleanString(value, maxLength);
      if (!trimmed) return null;

      try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
          throw new Error('invalid protocol');
        }
        return trimmed;
      } catch {
        return null;
      }
    };

    const cleanStringList = (value, maxItems, maxLength) =>
      Array.isArray(value)
        ? [...new Set(
            value
              .map((item) => cleanString(item, maxLength))
              .filter(Boolean)
          )].slice(0, maxItems)
        : [];

    const safeData = {
      version: Number.isInteger(Number(onboardingData.version))
        ? Number(onboardingData.version)
        : 1,
      role,
      primaryDomain: cleanString(onboardingData.primaryDomain, 120),
      selectedSkills: cleanStringList(onboardingData.selectedSkills, 6, 80),
      githubUrl: cleanUrl(onboardingData.githubUrl, 250),
      youtubeUrl: cleanUrl(onboardingData.youtubeUrl, 250),
      portfolioUrl: cleanUrl(onboardingData.portfolioUrl, 250),
      academicStatus: cleanString(onboardingData.academicStatus, 80),
      graduationMonth:
        Number.isInteger(Number(onboardingData.graduationMonth)) &&
        Number(onboardingData.graduationMonth) >= 1 &&
        Number(onboardingData.graduationMonth) <= 12
          ? Number(onboardingData.graduationMonth)
          : null,
      graduationYear:
        Number.isInteger(Number(onboardingData.graduationYear)) &&
        Number(onboardingData.graduationYear) >= 2000 &&
        Number(onboardingData.graduationYear) <= 2100
          ? Number(onboardingData.graduationYear)
          : null,
      availability: cleanString(onboardingData.availability, 80),
      clientType: cleanString(onboardingData.clientType, 100),
      hiringCategories: cleanStringList(onboardingData.hiringCategories, 6, 80),
      hiringIntent: cleanString(onboardingData.hiringIntent, 120),
      projectScope: cleanString(onboardingData.projectScope, 120),
      companyOrProjectName: cleanString(onboardingData.companyOrProjectName, 120),
      budgetPhilosophy: cleanString(onboardingData.budgetPhilosophy, 120)
    };

    if (normalizedStatus === 'COMPLETED' && role === 'STUDENT_FREELANCER') {
      if (!safeData.primaryDomain || safeData.selectedSkills.length === 0) {
        return res.status(422).json({
          error: 'Complete your focus and primary skills before finishing onboarding.'
        });
      }

      if (!safeData.academicStatus || !safeData.availability) {
        return res.status(422).json({
          error: 'Complete your academic status and availability before finishing onboarding.'
        });
      }

      if (!cleanString(tagline, 160)) {
        return res.status(422).json({
          error: 'Add a professional headline before finishing onboarding.'
        });
      }
    }

    if (normalizedStatus === 'COMPLETED' && role === 'CLIENT') {
      const clientTypes = new Set([
        'Solo Founder / Individual',
        'Early-stage Startup',
        'Small Business',
        'Company',
        'Academic / Research',
        'Non-profit / Organization'
      ]);

      if (!clientTypes.has(safeData.clientType || '')) {
        return res.status(422).json({
          error: 'Choose a valid client type before finishing onboarding.'
        });
      }

      if (
        safeData.hiringCategories.length === 0 ||
        !safeData.hiringIntent ||
        !safeData.projectScope ||
        !safeData.budgetPhilosophy ||
        !safeData.companyOrProjectName
      ) {
        return res.status(422).json({
          error: 'Complete your hiring preferences and company/project name before finishing onboarding.'
        });
      }
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        tagline: cleanString(tagline, 160) || '',
        bio: cleanString(bio, 2000) || '',
        category: cleanString(category, 120) || 'Graphic Design',
        skills: cleanStringList(skills, 20, 80),
        avatarUrl: cleanString(avatarUrl, 500),
        githubUrl: cleanUrl(githubUrl, 250),
        youtubeUrl: cleanUrl(youtubeUrl, 250),
        drivePortfolio: cleanUrl(drivePortfolio, 250),
        responseTimeExpectation: cleanString(responseTimeExpectation, 120),
        onboardingCompleted: normalizedStatus === 'COMPLETED',
        onboardingStatus: normalizedStatus,
        onboardingData: safeData
      },
      update: {
        tagline: cleanString(tagline, 160) || undefined,
        bio: cleanString(bio, 2000) || undefined,
        category: cleanString(category, 120) || undefined,
        skills: Array.isArray(skills) ? cleanStringList(skills, 20, 80) : undefined,
        avatarUrl: cleanString(avatarUrl, 500) || undefined,
        githubUrl: cleanUrl(githubUrl, 250) || undefined,
        youtubeUrl: cleanUrl(youtubeUrl, 250) || undefined,
        drivePortfolio: cleanUrl(drivePortfolio, 250) || undefined,
        responseTimeExpectation: cleanString(responseTimeExpectation, 120) || undefined,
        onboardingCompleted: normalizedStatus === 'COMPLETED',
        onboardingStatus: normalizedStatus,
        onboardingData: safeData
      }
    });

    return res.json({
      message: 'Onboarding state saved successfully.',
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Update onboarding error:', err);
    return res.status(500).json({
      error: 'Unable to save onboarding state.'
    });
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
    res.status(500).json({ error: 'Request could not be completed.' });
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

    res.status(201).json({
      message: 'Verification document submitted successfully for review.',
      status: verification.status,
      collegeIdStatus: verification.collegeIdStatus,
      govtIdStatus: verification.govtIdStatus
    });
  } catch (err) {
    console.error('Submit verification error:', err);
    res.status(500).json({ error: 'Request could not be completed.' });
  }
};
