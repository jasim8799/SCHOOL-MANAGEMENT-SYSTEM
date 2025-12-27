// Script to add mobile number to principal account
// Run this with: node scripts/add-mobile-to-principal.js

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');

async function addMobile() {
  try {
    await connectDB();
    console.log('Connected to database');

    const principalEmail = 'principal@demo.school';
    const mobileNumber = '+918799760471';
    const schoolId = '694e70343f5f229cbc518c33';

    // Find and update the principal user
    const result = await User.findOneAndUpdate(
      { 
        email: principalEmail, 
        schoolId: schoolId 
      },
      { 
        $set: { 
          'meta.mobile': mobileNumber 
        } 
      },
      { 
        new: true,
        upsert: false
      }
    );

    if (result) {
      console.log('✅ SUCCESS: Mobile number added to principal account');
      console.log('Principal:', result.name);
      console.log('Email:', result.email);
      console.log('Mobile:', result.meta?.mobile);
      console.log('\nYou can now login with:');
      console.log('  Email: principal@demo.school');
      console.log('  Password: Admin@123');
      console.log('  School ID: 694e70343f5f229cbc518c33');
      console.log('\nOTP will be sent to:', mobileNumber);
    } else {
      console.log('❌ ERROR: Principal user not found');
      console.log('Please make sure:');
      console.log('  1. The email is correct: principal@demo.school');
      console.log('  2. The school ID is correct: 694e70343f5f229cbc518c33');
      console.log('  3. The user exists in the database');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure MONGODB_URI is set in your .env file');
    console.error('  2. Check if the database is accessible');
    console.error('  3. Verify your network connection');
    process.exit(1);
  }
}

addMobile();
