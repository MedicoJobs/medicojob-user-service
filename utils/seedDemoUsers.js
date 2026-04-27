const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD;

const DEMO_USERS = [
  {
    name: 'Demo Applicant',
    email: 'applicant@medicojob.com',
    role: 'applicant',
    specialization: 'General Medicine',
    licenseNumber: 'APP-DEMO-001',
    verified: true,
  },
  {
    name: 'Demo Hospital',
    email: 'hospital@medicojob.com',
    role: 'hospital',
    licenseNumber: 'HSP-DEMO-001',
    verified: true,
  },
];

async function ensureDemoUsers() {
  if (!DEMO_PASSWORD) {
    console.log('Demo users skipped because DEMO_USER_PASSWORD is not configured');
    return;
  }

  for (const demoUser of DEMO_USERS) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (existingUser) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    await User.create({
      ...demoUser,
      password: hashedPassword,
    });
  }
}

module.exports = {
  ensureDemoUsers,
  DEMO_USERS,
};
