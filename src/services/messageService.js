const MessageLog = require('../models/MessageLog');
const https = require('https');

// Simple in-memory rate limit counters per school
const rateCounters = new Map();
const RATE_LIMIT = 100; // messages per minute per school

function checkRateLimit(schoolId) {
  const key = String(schoolId);
  const now = Date.now();
  const entry = rateCounters.get(key) || { ts: now, count: 0 };
  if (now - entry.ts > 60000) {
    entry.ts = now;
    entry.count = 0;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  rateCounters.set(key, entry);
  return true;
}

/**
 * Send SMS via Fast2SMS
 */
async function sendSmsViaFast2SMS(mobile, message) {
  const apiKey = process.env.CxIk93BGzrLUMGOiTrwQ2TnEPeHN2MEWCXkExQKTNjtyPDy395GcHvudaP6E;
  
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY not configured in environment');
  }

  // Strip country code and any special characters
  const cleanNumber = mobile.replace(/^\+91/, '').replace(/\D/g, '');
  
  console.log('📱 Fast2SMS: Sending SMS to', `+91${cleanNumber}`);

  const payload = JSON.stringify({
    route: 'q',
    language: 'english',
    message: message,
    numbers: cleanNumber
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Fast2SMS Response:', data);
        
        try {
          const response = JSON.parse(data);
          
          if (response.return === true || res.statusCode === 200) {
            console.log('✅ Fast2SMS: SMS sent successfully to', `+91${cleanNumber}`);
            resolve({ success: true, response });
          } else {
            console.error('❌ Fast2SMS: Failed -', response.message || data);
            reject(new Error(response.message || 'Fast2SMS API returned failure'));
          }
        } catch (err) {
          console.error('❌ Fast2SMS: Invalid response -', data);
          reject(new Error('Failed to parse Fast2SMS response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Fast2SMS: Request error -', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main message sending function
 */
async function sendMessage({ schoolId, channel, to, template, payload, createdBy }) {
  // Rate limit check
  if (!checkRateLimit(schoolId)) {
    console.log('❌ MESSAGE SERVICE: Rate limited');
    const log = await MessageLog.create({ 
      schoolId, 
      channel, 
      to, 
      template, 
      payload, 
      status: 'failed', 
      createdBy 
    });
    return { success: false, reason: 'rate_limited', log };
  }

  try {
    // Build message based on template
    let message = '';
    
    if (template === 'login_otp' && payload?.otp) {
      message = `Your ERP login OTP is ${payload.otp}. Valid for 5 minutes. Do not share this OTP.`;
    } else {
      message = payload?.message || 'Message from School ERP';
    }

    console.log('📤 MESSAGE SERVICE: Sending via Fast2SMS');
    console.log('   Channel:', channel);
    console.log('   To:', to);
    console.log('   Template:', template);

    // Send via Fast2SMS
    const result = await sendSmsViaFast2SMS(to, message);

    // Log success
    const log = await MessageLog.create({ 
      schoolId, 
      channel, 
      to, 
      template, 
      payload, 
      status: 'sent', 
      createdBy 
    });

    return { success: true, log };

  } catch (error) {
    console.error('❌ MESSAGE SERVICE: Failed to send -', error.message);
    
    // Log failure
    const log = await MessageLog.create({ 
      schoolId, 
      channel, 
      to, 
      template, 
      payload, 
      status: 'failed', 
      createdBy 
    });

    return { success: false, reason: error.message, log };
  }
}

module.exports = { sendMessage };
