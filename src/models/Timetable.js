const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Types.ObjectId, ref: 'School', required: true, index: true },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: mongoose.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true }, // 0-6
    period: { type: String, required: true }, // e.g., 'P1','1'
    meta: { type: Object }
  },
  { timestamps: true }
);

TimetableSchema.index({ schoolId: 1, classId: 1, dayOfWeek: 1, period: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
