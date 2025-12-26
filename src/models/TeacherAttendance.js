const mongoose = require('mongoose');

const TeacherAttendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
  teacherId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
  markedAt: { type: Date, default: Date.now }
}, { timestamps: true });

TeacherAttendanceSchema.index({ schoolId: 1, teacherId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', TeacherAttendanceSchema);
