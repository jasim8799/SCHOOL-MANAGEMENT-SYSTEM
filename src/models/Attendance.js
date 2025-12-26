const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true, index: true },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
    subjectId: { type: mongoose.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: mongoose.Types.ObjectId, ref: 'User' },
    period: { type: String },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
    notes: { type: String },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Daily attendance (legacy/index)
AttendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 });
// Subject-wise idempotent key (period-aware)
AttendanceSchema.index({ schoolId: 1, studentId: 1, classId: 1, subjectId: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
