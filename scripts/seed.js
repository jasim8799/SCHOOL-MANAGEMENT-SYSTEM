// Seed script for local/demo usage
// Creates Demo Public School and Principal user (idempotent)

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { connectDB } = require('../src/config/db');
const School = require('../src/models/School');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');
const { ROLES } = require('../src/config/constants');

async function seed() {
  await connectDB();

  const schoolName = 'Demo Public School';
  const schoolCode = 'DPS';
  const principalEmail = 'principal@demo.school';
  const principalPassword = 'Admin@123';

  // Create or update school
  let school = await School.findOne({ name: schoolName });
  if (!school) {
    school = new School({ name: schoolName, code: schoolCode, enabledModules: ['excel_import', 'audit_logging'], storageLimitMB: 2048 });
    await school.save();
    console.log('Created school:', schoolName);
  } else {
    // Ensure modules enabled
    const mods = new Set([...(school.enabledModules || []), 'excel_import', 'audit_logging']);
    school.enabledModules = Array.from(mods);
    school.code = school.code || schoolCode;
    await school.save();
    console.log('School already exists, updated modules if necessary.');
  }

  // Create or update principal user
  let principal = await User.findOne({ email: principalEmail, schoolId: school.schoolId || school._id });
  if (!principal) {
    const passwordHash = await hashPassword(principalPassword);
    principal = new User({
      schoolId: school.schoolId || school._id,
      name: 'Demo Principal',
      email: principalEmail,
      passwordHash,
      role: ROLES.PRINCIPAL,
      isActive: true,
      createdBy: null
    });
    await principal.save();
    console.log('Created principal user:', principalEmail);
  } else {
    console.log('Principal already exists, skipping creation.');
  }

  console.log('\nSEED COMPLETE');
  console.log('Principal login credentials:');
  console.log(`  email: ${principalEmail}`);
  console.log(`  password: ${principalPassword}`);
  console.log('\nTo login via API (example):');
  console.log(`  curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"${principalEmail}","password":"${principalPassword}","schoolId":"${school.schoolId || school._id}"}'`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
