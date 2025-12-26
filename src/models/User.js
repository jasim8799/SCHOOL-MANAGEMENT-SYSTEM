const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    documents: [{ type: { type: String }, url: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
    meta: { type: Object },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

UserSchema.index({ schoolId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
