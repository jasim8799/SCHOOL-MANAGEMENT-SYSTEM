const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    examName: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
    subjects: [
      {
        subject: { type: String },
        date: { type: Date },
        notes: { type: String }
      }
    ],
    admitCardEnabled: { type: Boolean, default: false },
    meta: { type: Object },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ExamSchema.index({ schoolId: 1, name: 1 });

module.exports = mongoose.model('Exam', ExamSchema);
