const mongoose = require('mongoose');

const MessageLogSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    channel: { type: String, enum: ['sms', 'whatsapp', 'in-app'], required: true },
    to: { type: String },
    template: { type: String },
    payload: { type: Object },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

MessageLogSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MessageLog', MessageLogSchema);
