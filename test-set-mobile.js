// Quick test script for set-mobile endpoint
// Usage: node test-set-mobile.js

const https = require('https');

const BACKEND_URL = 'school-management-system-w7cw.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || 'your-secret-here';

const requestData = JSON.stringify({
  email: 'principal@demo.school',
  mobile: '+918799760471'
});

const options = {
  hostname: BACKEND_URL,
  port: 443,
  path: '/api/admin/set-mobile',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
    'Content-Length': requestData.length
  }
};

console.log('🚀 Testing set-mobile endpoint...');
console.log('URL:', `https://${BACKEND_URL}/api/admin/set-mobile`);
console.log('Email: principal@demo.school');
console.log('Mobile: +918799760471');
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('');
      console.log('✅ SUCCESS! Mobile number has been set.');
      console.log('You can now login and receive OTP on +918799760471');
    } else {
      console.log('');
      console.log('❌ FAILED. Check the error message above.');
      if (res.statusCode === 403) {
        console.log('💡 Make sure ADMIN_BOOTSTRAP_SECRET is correct');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(requestData);
req.end();
