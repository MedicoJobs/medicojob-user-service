const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_USERS = [
  {
    name: 'Demo Applicant',
    email: 'applicant@medicojob.com',
    password: 'Demo123!',
    role: 'applicant',
    specialization: 'General Medicine',
    licenseNumber: 'APP-DEMO-001',
    verified: true,
  },
  {
    name: 'Demo Hospital',
    email: 'hospital@medicojob.com',
    password: 'Demo123!',
    role: 'hospital',
    licenseNumber: 'HSP-DEMO-001',
    verified: true,
  },
];

async function ensureDemoUsers() {
  for (const demoUser of DEMO_USERS) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (existingUser) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(demoUser.password, 10);

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
