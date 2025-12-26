const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema(
  {
    // schoolId will be set to the document _id upon creation to support multi-tenant checks
    schoolId: { type: mongoose.Types.ObjectId, index: true, unique: true },
    name: { type: String, required: true, index: true },
    domain: { type: String },
    logoUrl: { type: String },
    enabledModules: [{ type: String }],
    notificationPreferences: {
      type: Object,
      default: {
        enableWhatsApp: true,
        enableSMS: false,
        allowedEvents: ['fee_reminder', 'fee_paid', 'exam_schedule_announced', 'admit_card_published', 'announcement_published', 'exam_notes_published', 'video_published', 'student_admitted', 'staff_created']
      }
    },
    storageLimitMB: { type: Number, default: 1024 },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

SchoolSchema.index({ name: 1 });

SchoolSchema.pre('save', function (next) {
  if (!this.schoolId) this.schoolId = this._id;
  next();
});

module.exports = mongoose.model('School', SchoolSchema);
