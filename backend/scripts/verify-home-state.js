/*
 * Local development-only Home verification data.
 *
 * Usage:
 *   node scripts/verify-home-state.js seed
 *   node scripts/verify-home-state.js cleanup
 *
 * This script creates only clearly identified test accounts/data in the
 * configured local database and can remove only those test records.
 */

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

const STUDENT_EMAIL = 'home-verify-student@local.test';
const CLIENT_EMAIL = 'home-verify-client@local.test';
const STUDENT_USERNAME = '__home_verify_student';
const CLIENT_USERNAME = '__home_verify_client';
const TEST_GIG_TITLE = '[HOME_VERIFY] Student Test Gig';
const TEST_JOB_TITLE = '[HOME_VERIFY] Client Test Job';

async function getOrCreateUsers() {
  const passwordHash = await bcrypt.hash('HomeVerify@2026', 12);

  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      username: STUDENT_USERNAME,
      firstName: 'Home',
      lastName: 'Student',
      fullName: 'Home Student',
      role: 'STUDENT_FREELANCER',
      isMinor: false,
      age: 20,
      passwordHash,
      isSuspended: false,
      isBanned: false
    },
    create: {
      username: STUDENT_USERNAME,
      email: STUDENT_EMAIL,
      passwordHash,
      firstName: 'Home',
      lastName: 'Student',
      fullName: 'Home Student',
      role: 'STUDENT_FREELANCER',
      isMinor: false,
      age: 20,
      dob: new Date('2006-01-15T00:00:00.000Z'),
      profile: {
        create: {
          tagline: 'Home verification student',
          bio: 'Local Home verification account.',
          category: 'Web Development',
          hourlyRate: 500,
          skills: ['Web Development', 'Testing'],
          onboardingCompleted: true,
          onboardingStatus: 'COMPLETED',
          onboardingData: {
            version: 1,
            role: 'STUDENT_FREELANCER',
            primaryDomain: 'Web Development',
            selectedSkills: ['Web Development', 'Testing'],
            academicStatus: 'Undergraduate',
            graduationYear: 2028,
            availability: 'Part-time (< 20 hrs)'
          },
          portfolioItems: [
            {
              id: 'home-verify-portfolio-1',
              title: 'Home verification sample',
              category: 'Web Development',
              link: 'https://example.com/home-verification'
            }
          ]
        }
      },
      wallet: {
        create: {
          availableBalance: 4750,
          pendingBalance: 0,
          isParentAccount: false
        }
      },
      verification: {
        create: {
          educationType: 'COLLEGE',
          collegeName: 'Home Verification College',
          status: 'APPROVED',
          collegeIdStatus: 'APPROVED'
        }
      }
    }
  });

  const client = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: {
      username: CLIENT_USERNAME,
      firstName: 'Home',
      lastName: 'Client',
      fullName: 'Home Client',
      role: 'CLIENT',
      isMinor: false,
      age: 25,
      passwordHash,
      isSuspended: false,
      isBanned: false
    },
    create: {
      username: CLIENT_USERNAME,
      email: CLIENT_EMAIL,
      passwordHash,
      firstName: 'Home',
      lastName: 'Client',
      fullName: 'Home Client',
      role: 'CLIENT',
      isMinor: false,
      age: 25,
      dob: new Date('2001-01-15T00:00:00.000Z'),
      profile: {
        create: {
          tagline: 'Home verification client',
          bio: 'Local Home verification account.',
          category: 'Web Development',
          onboardingCompleted: true,
          onboardingStatus: 'COMPLETED',
          onboardingData: {
            version: 1,
            role: 'CLIENT',
            clientType: 'Company',
            hiringCategories: ['Web Development'],
            hiringIntent: 'One-time project',
            projectScope: 'Under 1 week',
            budgetPhilosophy: 'Fixed-price micro-projects',
            companyOrProjectName: 'Home Verification Studio'
          }
        }
      },
      wallet: {
        create: {
          availableBalance: 0,
          pendingBalance: 0,
          isParentAccount: false
        }
      }
    }
  });

  await prisma.profile.upsert({
    where: { userId: student.id },
    update: {
      tagline: 'Home verification student',
      bio: 'Local Home verification account.',
      onboardingCompleted: true,
      onboardingStatus: 'COMPLETED',
      onboardingData: {
        version: 1,
        role: 'STUDENT_FREELANCER',
        primaryDomain: 'Web Development',
        selectedSkills: ['Web Development', 'Testing'],
        academicStatus: 'Undergraduate',
        graduationYear: 2028,
        availability: 'Part-time (< 20 hrs)'
      },
      portfolioItems: [
        {
          id: 'home-verify-portfolio-1',
          title: 'Home verification sample',
          category: 'Web Development',
          link: 'https://example.com/home-verification'
        }
      ]
    },
    create: {
      userId: student.id,
      tagline: 'Home verification student',
      bio: 'Local Home verification account.',
      category: 'Web Development',
      hourlyRate: 500,
      skills: ['Web Development', 'Testing'],
      onboardingCompleted: true,
      onboardingStatus: 'COMPLETED',
      onboardingData: {
        version: 1,
        role: 'STUDENT_FREELANCER',
        primaryDomain: 'Web Development',
        selectedSkills: ['Web Development', 'Testing'],
        academicStatus: 'Undergraduate',
        graduationYear: 2028,
        availability: 'Part-time (< 20 hrs)'
      },
      portfolioItems: [
        {
          id: 'home-verify-portfolio-1',
          title: 'Home verification sample',
          category: 'Web Development',
          link: 'https://example.com/home-verification'
        }
      ]
    }
  });

  await prisma.profile.upsert({
    where: { userId: client.id },
    update: {
      tagline: 'Home Verification Studio',
      bio: 'Local Home verification client.',
      onboardingCompleted: true,
      onboardingStatus: 'COMPLETED',
      onboardingData: {
        version: 1,
        role: 'CLIENT',
        clientType: 'Company',
        hiringCategories: ['Web Development'],
        hiringIntent: 'One-time project',
        projectScope: 'Under 1 week',
        budgetPhilosophy: 'Fixed-price micro-projects',
        companyOrProjectName: 'Home Verification Studio'
      }
    },
    create: {
      userId: client.id,
      tagline: 'Home Verification Studio',
      bio: 'Local Home verification client.',
      category: 'Web Development',
      onboardingCompleted: true,
      onboardingStatus: 'COMPLETED',
      onboardingData: {
        version: 1,
        role: 'CLIENT',
        clientType: 'Company',
        hiringCategories: ['Web Development'],
        hiringIntent: 'One-time project',
        projectScope: 'Under 1 week',
        budgetPhilosophy: 'Fixed-price micro-projects',
        companyOrProjectName: 'Home Verification Studio'
      }
    }
  });

  await prisma.wallet.upsert({
    where: { userId: student.id },
    update: { availableBalance: 4750, pendingBalance: 0, isParentAccount: false },
    create: { userId: student.id, availableBalance: 4750, pendingBalance: 0, isParentAccount: false }
  });

  await prisma.verificationRequest.upsert({
    where: { userId: student.id },
    update: {
      educationType: 'COLLEGE',
      collegeName: 'Home Verification College',
      status: 'APPROVED',
      collegeIdStatus: 'APPROVED',
      reviewedAt: new Date()
    },
    create: {
      userId: student.id,
      educationType: 'COLLEGE',
      collegeName: 'Home Verification College',
      status: 'APPROVED',
      collegeIdStatus: 'APPROVED',
      reviewedAt: new Date()
    }
  });

  const gig = await prisma.gig.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {
      sellerId: student.id,
      title: TEST_GIG_TITLE,
      category: 'Web Development',
      description: 'Local Home verification Gig.',
      coverImage: '',
      status: 'PUBLISHED',
      isDeleted: false,
      deletedAt: null
    },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      sellerId: student.id,
      title: TEST_GIG_TITLE,
      category: 'Web Development',
      description: 'Local Home verification Gig.',
      coverImage: '',
      status: 'PUBLISHED'
    }
  });

  const job = await prisma.job.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {
      clientId: client.id,
      title: TEST_JOB_TITLE,
      category: 'Web Development',
      description: 'Local Home verification Job.',
      budget: 3000,
      status: 'published',
      isOpen: true,
      isDeleted: false,
      deletedAt: null
    },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      clientId: client.id,
      title: TEST_JOB_TITLE,
      category: 'Web Development',
      description: 'Local Home verification Job.',
      budget: 3000,
      status: 'published',
      isOpen: true
    }
  });

  await prisma.bid.upsert({
    where: {
      jobId_studentId: {
        jobId: job.id,
        studentId: student.id
      }
    },
    update: {
      proposedAmount: 2800,
      deliveryDays: 5,
      coverLetter: 'Local Home verification proposal.',
      status: 'PENDING'
    },
    create: {
      jobId: job.id,
      studentId: student.id,
      proposedAmount: 2800,
      deliveryDays: 5,
      coverLetter: 'Local Home verification proposal.',
      status: 'PENDING'
    }
  });

  const existingOrder = await prisma.order.findFirst({
    where: {
      clientId: client.id,
      sellerId: student.id,
      requirements: '[HOME_VERIFY] Escrow test order'
    },
    select: { id: true }
  });

  if (existingOrder) {
    await prisma.transfer.deleteMany({ where: { orderId: existingOrder.id } });
    await prisma.order.delete({ where: { id: existingOrder.id } });
  }

  const order = await prisma.order.create({
    data: {
      clientId: client.id,
      sellerId: student.id,
      gigId: gig.id,
      jobId: job.id,
      totalAmount: 3000,
      platformFee: 300,
      sellerEarnings: 2700,
      status: 'FUNDED_IN_ESCROW',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requirements: '[HOME_VERIFY] Escrow test order'
    }
  });

  const transfer = await prisma.transfer.create({
    data: {
      orderId: order.id,
      amount: 3000,
      onHold: true,
      status: 'PENDING'
    }
  });

  console.log('');
  console.log('HOME VERIFICATION DATA READY');
  console.log('--------------------------------');
  console.log('Student login');
  console.log('  Email:    ' + STUDENT_EMAIL);
  console.log('  Password: HomeVerify@2026');
  console.log('  Wallet:   ₹4750');
  console.log('  Proof:    portfolio item present');
  console.log('  Gigs:     1');
  console.log('  Proposals: 1');
  console.log('  Verified: APPROVED');
  console.log('');
  console.log('Client login');
  console.log('  Email:    ' + CLIENT_EMAIL);
  console.log('  Password: HomeVerify@2026');
  console.log('  Company:  Home Verification Studio');
  console.log('  Held escrow: ₹' + transfer.amount);
  console.log('');
  console.log('Expected Home API values:');
  console.log('  STUDENT financialSummary = 4750');
  console.log('  STUDENT profileComplete = true');
  console.log('  STUDENT proofOfWorkComplete = true');
  console.log('  STUDENT hasGig = true');
  console.log('  STUDENT hasProposal = true');
  console.log('  CLIENT financialSummary = 3000');
  console.log('  CLIENT companyOrProjectName = Home Verification Studio');
  console.log('');
}

async function cleanup() {
  const student = await prisma.user.findFirst({
    where: { email: STUDENT_EMAIL },
    select: { id: true }
  });

  const client = await prisma.user.findFirst({
    where: { email: CLIENT_EMAIL },
    select: { id: true }
  });

  if (!student && !client) {
    console.log('No Home verification data found.');
    return;
  }

  const orderWhere = {
    OR: [
      ...(student ? [{ sellerId: student.id }] : []),
      ...(client ? [{ clientId: client.id }] : [])
    ]
  };

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: { id: true }
  });

  const orderIds = orders.map((row) => row.id);

  if (orderIds.length) {
    await prisma.transfer.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.deliverable.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.message.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.review.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.dispute.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderActivityEvent.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  const job = await prisma.job.findFirst({
    where: { title: TEST_JOB_TITLE },
    select: { id: true }
  });

  if (job) {
    await prisma.bid.deleteMany({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
  }

  await prisma.gig.deleteMany({ where: { title: TEST_GIG_TITLE } });

  if (client) {
    await prisma.user.delete({ where: { id: client.id } });
  }

  if (student) {
    await prisma.user.delete({ where: { id: student.id } });
  }

  console.log('Home verification data cleaned up.');
}

async function main() {
  const mode = process.argv[2];

  if (!['seed', 'cleanup'].includes(mode)) {
    console.error('Usage: node scripts/verify-home-state.js seed|cleanup');
    process.exitCode = 1;
    return;
  }

  if (mode === 'seed') {
    await getOrCreateUsers();
  } else {
    await cleanup();
  }
}

main()
  .catch((error) => {
    console.error('Home verification script failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
