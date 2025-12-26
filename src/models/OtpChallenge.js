const mongoose = require('mongoose');

const OtpChallengeSchema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    role: { type: String, required: true },
    channel: { type: String, enum: ['sms', 'whatsapp'], default: 'sms' },
    destination: { type: String },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    status: { type: String, enum: ['pending', 'verified', 'expired'], default: 'pending', index: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

OtpChallengeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('OtpChallenge', OtpChallengeSchema);
