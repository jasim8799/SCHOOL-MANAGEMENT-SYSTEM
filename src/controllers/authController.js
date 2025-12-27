const crypto = require('crypto');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const { comparePassword } = require('../utils/password');
const { sign } = require('../utils/jwt');
const { generateOtp, hashOtp, addMinutes } = require('../utils/otp');
const { sendMessage } = require('../services/messageService');

async function login(req, res, next) {
  try {
    const { email, password, schoolId, userId, mobile } = req.body;
    const platform = req.headers['x-platform'] || 'web'; // web or mobile

    let user;
    // Staff path: email + password + schoolId (web only)
    if (email && schoolId) {
      user = await User.findOne({ email: String(email).toLowerCase(), schoolId });
    } else {
      // Student/Parent path: userId or mobile + password (schoolId auto) (mobile only)
      const q = [];
      if (userId) q.push({ 'meta.userId': userId });
      if (mobile) q.push({ 'meta.mobile': mobile });
      if (q.length === 0) return res.status(400).json({ error: 'userId or mobile required', code: 'MISSING_IDENTIFIER' });
      user = await User.findOne({ $or: q });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_PASSWORD' });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_PASSWORD' });

    // Platform + Role validation
    const webRoles = ['principal', 'operator', 'teacher'];
    const mobileRoles = ['teacher', 'student', 'parent'];
    const userRole = String(user.role || '').toLowerCase();
    
    if (platform === 'web' && !webRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Role not allowed on web', code: 'ROLE_NOT_ALLOWED' });
    }
    if (platform === 'mobile' && !mobileRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Role not allowed on mobile', code: 'ROLE_NOT_ALLOWED' });
    }

    // Require mobile for OTP delivery
    const destination = user?.meta?.mobile;
    if (!destination) return res.status(400).json({ error: 'Mobile number required for OTP', code: 'MOBILE_REQUIRED' });

    // Create OTP challenge (without sending OTP yet)
    const challengeId = crypto.randomBytes(16).toString('hex');
    const challenge = await OtpChallenge.create({
      challengeId,
      userId: user._id,
      schoolId: user.schoolId,
      role: user.role,
      platform,
      destination,
      otpHash: hashOtp(generateOtp()), // initial placeholder (will be replaced on request-otp)
      expiresAt: addMinutes(new Date(), 5),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
    });

    // Mask destination for UI
    const mask = maskMobile(destination);
    return res.json({ challengeId, role: user.role, schoolId: String(user.schoolId), destinationMask: mask, code: 'OK' });
  } catch (err) {
    next(err);
  }
}

async function requestOtp(req, res, next) {
  try {
    const { challengeId, channel = 'sms' } = req.body;
    const challenge = await OtpChallenge.findOne({ challengeId });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found', code: 'CHALLENGE_NOT_FOUND' });

    if (challenge.status !== 'pending') return res.status(400).json({ error: 'Challenge not pending', code: 'CHALLENGE_INVALID' });
    const now = new Date();
    if (challenge.expiresAt <= now) {
      challenge.status = 'expired';
      await challenge.save();
      return res.status(400).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
    }

    // Generate and store new OTP, reset attempts
    const otp = generateOtp();
    challenge.otpHash = hashOtp(otp);
    challenge.expiresAt = addMinutes(now, 5);
    challenge.attempts = 0;
    await challenge.save();

    // 🔍 DEBUG: Log OTP for testing (REMOVE IN PRODUCTION)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 OTP GENERATED');
    console.log('Mobile:', challenge.destination);
    console.log('OTP:', otp);
    console.log('Expires:', challenge.expiresAt.toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Send via MessageService
    const sendRes = await sendMessage({
      schoolId: challenge.schoolId,
      channel,
      to: challenge.destination,
      template: 'login_otp',
      payload: { otp },
      createdBy: challenge.userId,
    });
    if (!sendRes.success) return res.status(429).json({ error: 'Rate limited', code: 'RATE_LIMITED' });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { challengeId, otp } = req.body;
    const challenge = await OtpChallenge.findOne({ challengeId });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found', code: 'CHALLENGE_NOT_FOUND' });

    if (challenge.status !== 'pending') return res.status(400).json({ error: 'Challenge not pending', code: 'CHALLENGE_INVALID' });
    const now = new Date();
    if (challenge.expiresAt <= now) {
      challenge.status = 'expired';
      await challenge.save();
      return res.status(400).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
    }

    const isValid = hashOtp(String(otp)) === challenge.otpHash;
    if (!isValid) {
      challenge.attempts += 1;
      await challenge.save();
      return res.status(401).json({ error: 'Invalid OTP', code: 'INVALID_OTP' });
    }

    // Success: issue JWT with SAME payload
    const token = sign({ userId: String(challenge.userId), role: challenge.role, schoolId: String(challenge.schoolId) });
    challenge.status = 'verified';
    await challenge.save();
    return res.json({ token });
  } catch (err) {
    next(err);
  }
}

function maskMobile(m) {
  const s = String(m || '');
  if (s.length < 4) return '****';
  return `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

module.exports = { login, requestOtp, verifyOtp };
