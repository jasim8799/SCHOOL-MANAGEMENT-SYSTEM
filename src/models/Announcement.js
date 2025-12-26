const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['holiday', 'festival', 'notice', 'emergency'], default: 'notice', index: true },
    target: { type: String, enum: ['school', 'class'], default: 'school' },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

AnnouncementSchema.index({ schoolId: 1, publishedAt: -1 });
AnnouncementSchema.index({ schoolId: 1, classId: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
